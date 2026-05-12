using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Server.Models;
using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using System.Threading.Channels;

namespace Server.Queues
{
    /// <summary>Interface for location log queue — implemented by RabbitMQLocationQueue.</summary>
    public interface ILocationQueue
    {
        ValueTask QueueLocationAsync(LocationLog locationLog);
        ValueTask<LocationLog> ReadAsync(CancellationToken cancellationToken);
    }

    /// <summary>
    /// RabbitMQ implementation của ILocationQueue.
    ///
    /// Tại sao cần write buffer (Channel<LocationLog>) riêng?
    ///   - RabbitMQ.Client v6: IModel.BasicPublish() KHÔNG thread-safe.
    ///   - Khi nhiều HTTP request đồng thời gọi QueueLocationAsync(),
    ///     nếu tất cả cùng BasicPublish() trực tiếp → race condition → channel crash → message loss.
    ///   - Fix: HTTP thread chỉ ghi vào Channel<T> in-memory (thread-safe, O(1), không block).
    ///     Một dedicated PublisherTask đọc từ Channel và publish tuần tự sang RabbitMQ.
    ///     → Không còn concurrent access trên IModel → không còn race condition.
    ///
    /// Flow:
    ///   HTTP threads → _writeBuffer (Channel<T>) → PublishLoopAsync (1 thread) → RabbitMQ broker
    ///                                                                                    ↓
    ///   LocationQueueHostedService.ReadAsync() ← _readReady (SemaphoreSlim) ← EventingBasicConsumer
    /// </summary>
    public class RabbitMQLocationQueue : ILocationQueue, IDisposable
    {
        private readonly IConnection _connection;

        // Publisher channel: chỉ được dùng bởi PublishLoopAsync (1 thread) → thread-safe
        private readonly IModel _publisherChannel;

        // Consumer channel: RabbitMQ push message về, đẩy vào _readBuffer
        private readonly IModel _consumerChannel;

        private readonly ILogger<RabbitMQLocationQueue> _logger;
        private const string QueueName = "location_logs";

        // In-memory write buffer: HTTP thread ghi vào đây — instant, thread-safe
        private readonly Channel<LocationLog> _writeBuffer;

        // Read buffer: consumer RabbitMQ đẩy vào, HostedService đọc ra
        private readonly ConcurrentQueue<LocationLog> _readBuffer = new();
        private readonly SemaphoreSlim _readReady = new(0);

        // PublisherTask: 1 task duy nhất drain _writeBuffer → BasicPublish
        private readonly Task _publisherTask;
        private readonly CancellationTokenSource _cts = new();

        public RabbitMQLocationQueue(IConfiguration config, ILogger<RabbitMQLocationQueue> logger)
        {
            _logger = logger;

            var factory = new ConnectionFactory
            {
                AutomaticRecoveryEnabled = true,
                NetworkRecoveryInterval  = TimeSpan.FromSeconds(5),
                RequestedHeartbeat       = TimeSpan.FromSeconds(30)
            };

            var rmqUrl = config["RabbitMQ:Url"];
            if (!string.IsNullOrWhiteSpace(rmqUrl))
            {
                factory.Uri = new Uri(rmqUrl);
            }
            else
            {
                factory.HostName = config["RabbitMQ:Host"]     ?? "localhost";
                factory.Port     = int.Parse(config["RabbitMQ:Port"] ?? "5672");
                factory.UserName = config["RabbitMQ:User"]     ?? "guest";
                factory.Password = config["RabbitMQ:Password"] ?? "guest";
            }

            _connection = factory.CreateConnection("audiogo-location-queue");

            // ── Publisher channel ──────────────────────────────────────────────
            _publisherChannel = _connection.CreateModel();
            _publisherChannel.QueueDeclare(QueueName, durable: true, exclusive: false, autoDelete: false);

            // ConfirmSelect: đảm bảo broker xác nhận đã nhận message (publisher confirm mode)
            // Bỏ comment dòng dưới nếu muốn đảm bảo 100% không mất message (nhưng chậm hơn ~30%)
            // _publisherChannel.ConfirmSelect();

            // ── Consumer channel ───────────────────────────────────────────────
            _consumerChannel = _connection.CreateModel();
            _consumerChannel.QueueDeclare(QueueName, durable: true, exclusive: false, autoDelete: false);

            // prefetchCount=200: broker giao tối đa 200 msg chưa ack mỗi lúc
            // Tăng lên giúp throughput cao hơn với consumer nhanh (chỉ enqueue vào ConcurrentQueue)
            _consumerChannel.BasicQos(prefetchSize: 0, prefetchCount: 200, global: false);

            var consumer = new EventingBasicConsumer(_consumerChannel);
            consumer.Received += (_, ea) =>
            {
                try
                {
                    var json = Encoding.UTF8.GetString(ea.Body.ToArray());
                    var log  = JsonSerializer.Deserialize<LocationLog>(json);
                    if (log is not null)
                    {
                        _readBuffer.Enqueue(log);
                        _readReady.Release(); // Báo LocationQueueHostedService có item mới
                    }
                    // Manual ACK: broker xóa message khỏi queue
                    _consumerChannel.BasicAck(ea.DeliveryTag, multiple: false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[RabbitMQ] Consumer error — nack & requeue");
                    _consumerChannel.BasicNack(ea.DeliveryTag, multiple: false, requeue: true);
                }
            };
            _consumerChannel.BasicConsume(QueueName, autoAck: false, consumer: consumer);

            // ── Write buffer (in-process, thread-safe) ────────────────────────
            // Capacity 50_000: buffer đủ lớn cho burst 10000+ request cùng lúc
            _writeBuffer = Channel.CreateBounded<LocationLog>(new BoundedChannelOptions(50_000)
            {
                FullMode              = BoundedChannelFullMode.Wait,   // Back-pressure: chờ thay vì drop
                SingleWriter          = false,  // Nhiều HTTP thread ghi đồng thời
                SingleReader          = true,   // Chỉ 1 PublishLoopAsync đọc
                AllowSynchronousContinuations = false
            });

            // Khởi động publisher task — drain _writeBuffer → BasicPublish tuần tự
            _publisherTask = Task.Run(() => PublishLoopAsync(_cts.Token));
        }

        /// <summary>
        /// Thread-safe, non-blocking: HTTP thread chỉ ghi vào in-memory buffer.
        /// Không trực tiếp gọi BasicPublish → không race condition.
        /// </summary>
        public async ValueTask QueueLocationAsync(LocationLog locationLog)
        {
            await _writeBuffer.Writer.WriteAsync(locationLog);
        }

        /// <summary>Đọc LocationLog từ consumer buffer — gọi bởi LocationQueueHostedService.</summary>
        public async ValueTask<LocationLog> ReadAsync(CancellationToken cancellationToken)
        {
            await _readReady.WaitAsync(cancellationToken);
            _readBuffer.TryDequeue(out var log);
            return log!;
        }

        /// <summary>
        /// Publisher loop — chạy trên 1 thread duy nhất.
        /// Đọc từ _writeBuffer và gọi BasicPublish tuần tự → thread-safe hoàn toàn.
        /// </summary>
        private async Task PublishLoopAsync(CancellationToken ct)
        {
            _logger.LogInformation("[RabbitMQ] Publisher loop started.");

            try
            {
                await foreach (var log in _writeBuffer.Reader.ReadAllAsync(ct))
                {
                    try
                    {
                        var body  = JsonSerializer.SerializeToUtf8Bytes(log);
                        var props = _publisherChannel.CreateBasicProperties();
                        props.Persistent = true; // Ghi disk → không mất khi broker restart

                        _publisherChannel.BasicPublish(
                            exchange:        "",
                            routingKey:      QueueName,
                            basicProperties: props,
                            body:            body);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[RabbitMQ] BasicPublish failed — message may be lost.");
                    }
                }
            }
            catch (OperationCanceledException) { /* shutdown bình thường */ }

            _logger.LogInformation("[RabbitMQ] Publisher loop stopped.");
        }

        public void Dispose()
        {
            // Báo không nhận thêm — reader sẽ drain hết buffer còn lại rồi dừng
            _writeBuffer.Writer.TryComplete();
            try { _publisherTask.Wait(TimeSpan.FromSeconds(5)); } catch { /* ignore */ }

            _cts.Cancel();
            try { _consumerChannel?.Close(); } catch { }
            try { _publisherChannel?.Close(); } catch { }
            try { _connection?.Close(); }      catch { }
            _cts.Dispose();
        }
    }
}
