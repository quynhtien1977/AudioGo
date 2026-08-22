using Microsoft.EntityFrameworkCore;
using Server.Data;

namespace Server.Services
{
    /// <summary>
    /// Background service tự động ẩn POI vượt giới hạn sau grace period 3 ngày.
    ///
    /// Luồng:
    ///   1. Owner downgrade gói (MaxPoiCount giảm) → SubscriptionService set PoiGracePeriodUntil = now+3d
    ///   2. Service này chạy mỗi 6 giờ, tìm subscription đã qua grace period
    ///   3. Với mỗi owner còn vượt giới hạn:
    ///      - Lấy danh sách POI active, sort theo UpdatedAt DESC (giữ mới nhất)
    ///      - Skip POI có PoiRequest DELETE đang PENDING (owner đã chủ động gửi request xóa)
    ///      - Ẩn (IsActive=false) các POI thừa còn lại
    ///      - Clear PoiGracePeriodUntil trên subscription
    ///
    /// Cấu hình (appsettings.json):
    ///   "PoiLimitEnforcement": { "IntervalHours": 6 }
    /// </summary>
    public class PoiLimitEnforcementService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<PoiLimitEnforcementService> _logger;
        private readonly IConfiguration _config;

        public PoiLimitEnforcementService(
            IServiceScopeFactory scopeFactory,
            ILogger<PoiLimitEnforcementService> logger,
            IConfiguration config)
        {
            _scopeFactory = scopeFactory;
            _logger       = logger;
            _config       = config;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var intervalHours = _config.GetValue<int>("PoiLimitEnforcement:IntervalHours", 6);

            _logger.LogInformation(
                "PoiLimitEnforcementService started. Runs every {Interval}h to enforce POI limits after grace period.",
                intervalHours);

            // Delay ngắn khi khởi động để tránh chồng chéo với các service khác
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await EnforcePoiLimitsAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "PoiLimitEnforcementService encountered an error");
                }

                await Task.Delay(TimeSpan.FromHours(intervalHours), stoppingToken);
            }

            _logger.LogInformation("PoiLimitEnforcementService stopped.");
        }

        private async Task EnforcePoiLimitsAsync(CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var now = DateTime.UtcNow;

            // Tìm tất cả subscription ACTIVE đã qua grace period
            var expiredGrace = await db.OwnerSubscriptions
                .Include(s => s.Plan)
                .Where(s => s.Status == "ACTIVE"
                         && s.PoiGracePeriodUntil != null
                         && s.PoiGracePeriodUntil < now)
                .ToListAsync(ct);

            if (expiredGrace.Count == 0)
            {
                _logger.LogDebug("PoiLimitEnforcement: no expired grace periods found.");
                return;
            }

            _logger.LogInformation(
                "PoiLimitEnforcement: found {Count} subscriptions with expired grace period.",
                expiredGrace.Count);

            var totalHidden = 0;

            foreach (var sub in expiredGrace)
            {
                if (ct.IsCancellationRequested) break;

                try
                {
                    var hidden = await HideExcessPoisAsync(db, sub.AccountId, sub.Plan?.MaxPoiCount ?? 0, ct);
                    totalHidden += hidden;

                    // Clear grace period dù đã xử lý hay không (tránh check lại liên tục)
                    sub.PoiGracePeriodUntil = null;
                    sub.UpdatedAt           = now;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "PoiLimitEnforcement: error processing account {AccountId}", sub.AccountId);
                }
            }

            await db.SaveChangesAsync(ct);

            _logger.LogInformation(
                "PoiLimitEnforcement: completed. Hidden {TotalHidden} POI(s) across {Accounts} account(s).",
                totalHidden, expiredGrace.Count);
        }

        /// <summary>
        /// Ẩn POI vượt giới hạn của 1 owner.
        /// Giữ lại <paramref name="maxPoiCount"/> POI mới nhất (theo UpdatedAt DESC).
        /// Bỏ qua POI đã có PoiRequest DELETE đang PENDING (owner đang tự xử lý).
        /// </summary>
        /// <returns>Số POI đã ẩn.</returns>
        private async Task<int> HideExcessPoisAsync(
            AppDbContext db, string accountId, int maxPoiCount, CancellationToken ct)
        {
            if (maxPoiCount < 0) // -1 = unlimited
                return 0;

            // Lấy tất cả POI active của owner, sort theo UpdatedAt mới nhất trước
            var activePois = await db.Pois
                .Where(p => p.AccountId == accountId && p.IsActive)
                .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
                .ToListAsync(ct);

            if (activePois.Count <= maxPoiCount)
                return 0; // Không vượt giới hạn

            // Lấy danh sách POI đang có DELETE request PENDING
            // (owner đã chủ động gửi request xóa → bỏ qua, không tự ẩn)
            var poisWithPendingDeleteRequest = await db.PoiRequests
                .Where(r => r.AccountId  == accountId
                         && r.ActionType == "DELETE"
                         && r.Status     == "PENDING"
                         && r.PoiId     != null)
                .Select(r => r.PoiId!)
                .Distinct()
                .ToListAsync(ct);

            var pendingDeleteSet = new HashSet<string>(poisWithPendingDeleteRequest);

            // Giữ maxPoiCount POI đầu (mới nhất), ẩn phần còn lại
            // Nhưng skip các POI đang trong quá trình xóa (PENDING DELETE request)
            var poisToHide = activePois
                .Skip(maxPoiCount)
                .Where(p => !pendingDeleteSet.Contains(p.PoiId))
                .ToList();

            if (poisToHide.Count == 0)
                return 0;

            var now = DateTime.UtcNow;
            foreach (var poi in poisToHide)
            {
                poi.IsActive  = false;
                poi.UpdatedAt = now;
            }

            _logger.LogWarning(
                "PoiLimitEnforcement: auto-hidden {Count} POI(s) for Account={AccountId}. " +
                "MaxAllowed={Max}, TotalActive={Total}, PendingDeletes={Pending}.",
                poisToHide.Count, accountId, maxPoiCount,
                activePois.Count, pendingDeleteSet.Count);

            return poisToHide.Count;
        }
    }
}
