using Microsoft.EntityFrameworkCore;
using Server.Data;

namespace Server.Services
{
    /// <summary>
    /// Background service chạy hàng ngày để xóa dữ liệu cũ (auto-purge data retention):
    /// - LocationLog: chỉ giữ lại 30 ngày.
    /// - ListenHistory: chỉ giữ lại 90 ngày.
    ///
    /// Chạy định kỳ vào 3:00 AM ICT (20:00 UTC).
    /// </summary>
    public class DataRetentionService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<DataRetentionService> _logger;

        public DataRetentionService(
            IServiceScopeFactory scopeFactory,
            ILogger<DataRetentionService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DataRetentionService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Chờ đến 3AM ICT (UTC+7) = 20:00 UTC
                    var now = DateTime.UtcNow;
                    var nextRun = now.Date.AddHours(20);
                    if (now >= nextRun)
                    {
                        nextRun = nextRun.AddDays(1);
                    }
                    var delay = nextRun - now;

                    _logger.LogInformation("DataRetentionService: next purge scheduled at {NextRun} UTC (in {DelayHours:F1} hours)", nextRun, delay.TotalHours);
                    await Task.Delay(delay, stoppingToken);

                    await PurgeOldLogsAndHistoryAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "DataRetentionService encountered an error");
                    // Tránh vòng lặp vô hạn khi xảy ra lỗi liên tục, trì hoãn 1 giờ trước khi thử lại
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }

            _logger.LogInformation("DataRetentionService stopped.");
        }

        private async Task PurgeOldLogsAndHistoryAsync(CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            _logger.LogInformation("DataRetentionService: Starting data purge process...");

            // 1. LocationLog: Giữ 30 ngày (xóa các logs có Timestamp < 30 days ago)
            var cutoffLocation = DateTime.UtcNow.AddDays(-30);
            
            // Xóa trực tiếp dùng ExecuteDeleteAsync (EF Core 7+) để tối ưu hiệu năng vượt trội,
            // tránh load hàng ngàn rows vào memory rồi RemoveRange.
            var deletedLocationLogs = await db.LocationLogs
                .Where(l => l.Timestamp < cutoffLocation)
                .ExecuteDeleteAsync(ct);

            // 2. ListenHistory: Giữ 90 ngày (xóa các history có Timestamp < 90 days ago)
            var cutoffListen = DateTime.UtcNow.AddDays(-90);
            var deletedListenHistories = await db.ListenHistories
                .Where(h => h.Timestamp < cutoffListen)
                .ExecuteDeleteAsync(ct);

            _logger.LogInformation(
                "DataRetentionService: Purge completed. Deleted {LocationCount} old LocationLog rows (cutoff={LocationCutoff}) and {ListenCount} old ListenHistory rows (cutoff={ListenCutoff})",
                deletedLocationLogs, cutoffLocation, deletedListenHistories, cutoffListen);
        }
    }
}
