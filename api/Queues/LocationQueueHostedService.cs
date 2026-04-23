using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Queues
{
    public class LocationQueueHostedService : BackgroundService
    {
        private readonly ILocationQueue _queue;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<LocationQueueHostedService> _logger;

        public LocationQueueHostedService(
            ILocationQueue queue,
            IServiceProvider serviceProvider,
            ILogger<LocationQueueHostedService> logger)
        {
            _queue = queue;
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("LocationQueueHostedService is running.");
            var batch = new List<LocationLog>();

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Chờ item đầu tiên của batch, chờ vô hạn (hoặc cho đến khi bị cancel)
                    var location = await _queue.ReadAsync(stoppingToken);
                    batch.Add(location);

                    // Đọc thêm item cho đến khi đủ batch size (50) hoặc timeout (3s)
                    using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                    cts.CancelAfter(TimeSpan.FromSeconds(3));

                    try
                    {
                        while (batch.Count < 50 && !cts.Token.IsCancellationRequested)
                        {
                            var nextLocation = await _queue.ReadAsync(cts.Token);
                            batch.Add(nextLocation);
                        }
                    }
                    catch (OperationCanceledException)
                    {
                        // Timeout 3s đã đạt đến, đây là logic bình thường, tiến hành lưu batch
                    }

                    await SaveBatchAsync(batch, stoppingToken);
                    batch.Clear();
                }
                catch (OperationCanceledException)
                {
                    // Background service đang dừng
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi xảy ra trong LocationQueueHostedService.");
                }
            }
        }

        private async Task SaveBatchAsync(List<LocationLog> batch, CancellationToken stoppingToken)
        {
            if (!batch.Any()) return;

            try
            {
                using var scope = _serviceProvider.CreateScope();
                var repo = scope.ServiceProvider.GetRequiredService<ILocationLogRepository>();
                
                await repo.CreateBatchAsync(batch);
                _logger.LogInformation($"[LocationQueue] Đã lưu {batch.Count} vị trí GPS vào database.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[LocationQueue] Lỗi khi lưu batch.");
            }
        }
    }
}
