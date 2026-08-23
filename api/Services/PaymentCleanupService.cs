using Microsoft.EntityFrameworkCore;
using Server.Data;

namespace Server.Services
{
    /// <summary>
    /// Background service chạy định kỳ để expire các PaymentTransaction PENDING
    /// đã quá 30 phút mà không được xác nhận (user bỏ dở hoặc SePay không callback).
    ///
    /// Chạy mỗi 30 phút (có thể cấu hình qua appsettings PaymentCleanup:IntervalMinutes).
    /// </summary>
    public class PaymentCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<PaymentCleanupService> _logger;
        private readonly IConfiguration _config;

        public PaymentCleanupService(
            IServiceScopeFactory scopeFactory,
            ILogger<PaymentCleanupService> logger,
            IConfiguration config)
        {
            _scopeFactory = scopeFactory;
            _logger       = logger;
            _config       = config;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Mặc định 120 phút (thay vì 30 phút cũ) để giảm tần suất đánh thức Azure SQL.
            // Override qua Railway env var: PaymentCleanup__IntervalMinutes=120
            var intervalMinutes = _config.GetValue<int>("PaymentCleanup:IntervalMinutes", 120);
            var expireAfterMinutes = _config.GetValue<int>("PaymentCleanup:ExpireAfterMinutes", 30);

            _logger.LogInformation(
                "PaymentCleanupService started. Interval={Interval}min, ExpireAfter={Expire}min",
                intervalMinutes, expireAfterMinutes);

            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromMinutes(intervalMinutes), stoppingToken);

                try
                {
                    await ExpirePendingTransactionsAsync(expireAfterMinutes, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "PaymentCleanupService encountered an error");
                }
            }

            _logger.LogInformation("PaymentCleanupService stopped.");
        }

        private async Task ExpirePendingTransactionsAsync(int expireAfterMinutes, CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var cutoff = DateTime.UtcNow.AddMinutes(-expireAfterMinutes);

            // ✅ Guard: kiểm tra nhanh trước khi load toàn bộ rows vào memory.
            // Nếu không có giao dịch nào cần expire → thoát sớm, không tốn I/O thêm.
            var hasExpired = await db.PaymentTransactions
                .AnyAsync(t => t.Status == "PENDING" && t.CreatedAt < cutoff, ct);

            if (!hasExpired)
            {
                _logger.LogDebug("PaymentCleanup: no expired PENDING transactions found — skipping.");
                return;
            }

            var expired = await db.PaymentTransactions
                .Where(t => t.Status == "PENDING" && t.CreatedAt < cutoff)
                .ToListAsync(ct);

            if (expired.Count == 0)
            {
                _logger.LogDebug("PaymentCleanup: no expired PENDING transactions found");
                return;
            }

            foreach (var tx in expired)
            {
                tx.Status    = "EXPIRED";
                tx.UpdatedAt = DateTime.UtcNow;
            }

            await db.SaveChangesAsync(ct);

            _logger.LogInformation(
                "PaymentCleanup: expired {Count} PENDING transactions older than {Expire} minutes",
                expired.Count, expireAfterMinutes);
        }
    }
}
