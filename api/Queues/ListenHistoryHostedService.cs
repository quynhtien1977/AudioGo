using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Queues
{
    public class ListenHistoryHostedService : BackgroundService
    {
        private readonly IListenHistoryQueue _queue;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ListenHistoryHostedService> _logger;

        public ListenHistoryHostedService(
            IListenHistoryQueue queue,
            IServiceProvider serviceProvider,
            ILogger<ListenHistoryHostedService> logger)
        {
            _queue = queue;
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ListenHistoryHostedService is running.");
            var batch = new List<ListenHistory>();

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Chờ item đầu tiên của batch, chờ vô hạn (hoặc cho đến khi bị cancel)
                    var history = await _queue.ReadAsync(stoppingToken);
                    batch.Add(history);

                    // Đọc thêm item cho đến khi đủ batch size (20) hoặc timeout (5s)
                    using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                    cts.CancelAfter(TimeSpan.FromSeconds(5));

                    try
                    {
                        while (batch.Count < 20 && !cts.Token.IsCancellationRequested)
                        {
                            var nextHistory = await _queue.ReadAsync(cts.Token);
                            batch.Add(nextHistory);
                        }
                    }
                    catch (OperationCanceledException)
                    {
                        // Timeout 5s đã đạt đến, đây là logic bình thường, tiến hành lưu batch
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
                    _logger.LogError(ex, "Lỗi xảy ra trong ListenHistoryHostedService.");
                }
            }
        }

        private async Task SaveBatchAsync(List<ListenHistory> batch, CancellationToken stoppingToken)
        {
            if (!batch.Any()) return;

            try
            {
                using var scope = _serviceProvider.CreateScope();
                var repo = scope.ServiceProvider.GetRequiredService<IListenHistoryRepository>();
                
                await repo.CreateBatchAsync(batch);
                _logger.LogInformation($"[ListenHistoryQueue] Đã lưu {batch.Count} lượt nghe vào database.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ListenHistoryQueue] Lỗi khi lưu batch.");
            }
        }
    }
}
