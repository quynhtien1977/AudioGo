using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services
{
    /// <summary>
    /// Xử lý nghiệp vụ gói đăng ký Owner:
    ///   - Gán / gia hạn gói cho Owner
    ///   - Hạ Priority POI khi subscription hết hạn
    ///   - Kiểm tra giới hạn POI trước khi tạo mới
    /// </summary>
    public class SubscriptionService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<SubscriptionService> _logger;

        public SubscriptionService(AppDbContext db, ILogger<SubscriptionService> logger)
        {
            _db     = db;
            _logger = logger;
        }

        // ── Lấy gói đang active của Owner ────────────────────────────────────
        public async Task<OwnerSubscription?> GetActiveSubscriptionAsync(string accountId)
        {
            return await _db.OwnerSubscriptions
                .Include(s => s.Plan)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.AccountId == accountId && s.Status == "ACTIVE");
        }

        // ── Lấy plan hiện tại (fallback về basic) ────────────────────────────
        public async Task<SubscriptionPlan> GetCurrentPlanAsync(string accountId)
        {
            var account = await _db.Accounts
                .Include(a => a.SubscriptionPlan)
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AccountId == accountId);

            // fallback: basic nếu chưa có plan hoặc plan null
            return account?.SubscriptionPlan
                ?? await _db.SubscriptionPlans.FirstAsync(p => p.PlanId == "basic");
        }

        // ── Kiểm tra Owner có vượt giới hạn POI không ────────────────────────
        /// <returns>
        ///   null  = được phép tạo thêm
        ///   string = thông báo lỗi khi vượt giới hạn
        /// </returns>
        public async Task<string?> CheckPoiLimitAsync(string accountId)
        {
            var plan = await GetCurrentPlanAsync(accountId);

            // -1 = unlimited (Enterprise)
            if (plan.MaxPoiCount == -1)
                return null;

            var activePoiCount = await _db.Pois
                .CountAsync(p => p.AccountId == accountId && p.IsActive);

            if (activePoiCount >= plan.MaxPoiCount)
            {
                return $"Gói {plan.Name} chỉ cho phép tối đa {plan.MaxPoiCount} POI. " +
                       $"Hiện tại bạn đang có {activePoiCount} POI đang hoạt động. " +
                       $"Vui lòng nâng cấp gói để tạo thêm.";
            }

            return null;
        }

        // ── Gán / gia hạn subscription sau khi thanh toán thành công ─────────
        public async Task<OwnerSubscription> ActivateSubscriptionAsync(
            string accountId, string planId, string triggeredByTransactionId)
        {
            var plan = await _db.SubscriptionPlans.FindAsync(planId)
                ?? throw new ArgumentException($"PlanId '{planId}' không tồn tại.");

            var account = await _db.Accounts.FindAsync(accountId)
                ?? throw new ArgumentException($"AccountId '{accountId}' không tồn tại.");

            // Hủy subscription active cũ nếu có (downgrade / thay đổi gói)
            var existingActive = await _db.OwnerSubscriptions
                .FirstOrDefaultAsync(s => s.AccountId == accountId && s.Status == "ACTIVE");

            if (existingActive != null)
            {
                existingActive.Status    = "CANCELLED";
                existingActive.UpdatedAt = DateTime.UtcNow;

                // Nếu downgrade → hạ Priority tất cả POI về AutoPriority của gói mới
                var oldPlan = await _db.SubscriptionPlans.FindAsync(existingActive.PlanId);
                if (oldPlan != null && plan.AutoPriority < oldPlan.AutoPriority)
                {
                    await DowngradePoiPriorityAsync(accountId, plan.AutoPriority);
                }
            }

            // Tạo subscription mới
            var newSub = new OwnerSubscription
            {
                SubscriptionId = Guid.NewGuid().ToString(),
                AccountId      = accountId,
                PlanId         = planId,
                Status         = "ACTIVE",
                StartDate      = DateTime.UtcNow,
                EndDate        = DateTime.UtcNow.AddDays(plan.DurationDay),
                AutoRenew      = false,
                CreatedAt      = DateTime.UtcNow
            };
            _db.OwnerSubscriptions.Add(newSub);

            // Cập nhật shortcut trên Account
            account.SubscriptionPlanId = planId;
            account.UpdatedAt          = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Subscription activated: Account={AccountId} Plan={PlanId} SubId={SubId} TxId={TxId}",
                accountId, planId, newSub.SubscriptionId, triggeredByTransactionId);

            return newSub;
        }

        // ── Hạ Priority tất cả POI của Owner về mức mới ──────────────────────
        private async Task DowngradePoiPriorityAsync(string accountId, int newPriority)
        {
            var pois = await _db.Pois
                .Where(p => p.AccountId == accountId && p.IsActive && p.Priority > newPriority)
                .ToListAsync();

            foreach (var poi in pois)
            {
                poi.Priority  = newPriority;
                poi.UpdatedAt = DateTime.UtcNow;
            }

            if (pois.Count > 0)
            {
                _logger.LogInformation(
                    "Downgraded priority for {Count} POIs of Account={AccountId} to {Priority}",
                    pois.Count, accountId, newPriority);
            }
            // SaveChanges được gọi từ caller
        }

        // ── Batch job: Expire các subscription quá hạn ───────────────────────
        /// <summary>
        /// Gọi bởi background job (Hangfire/hosted service) theo lịch hàng ngày.
        /// Tìm các ACTIVE subscription đã qua EndDate → EXPIRED + hạ Priority POI.
        /// </summary>
        public async Task ExpireOverdueSubscriptionsAsync()
        {
            var now      = DateTime.UtcNow;
            var overdues = await _db.OwnerSubscriptions
                .Include(s => s.Plan)
                .Where(s => s.Status == "ACTIVE" && s.EndDate < now)
                .ToListAsync();

            foreach (var sub in overdues)
            {
                sub.Status    = "EXPIRED";
                sub.UpdatedAt = now;

                // Hạ Priority tất cả POI về mức 1 (LOW — basic plan)
                await DowngradePoiPriorityAsync(sub.AccountId, 1);

                // Cập nhật shortcut Account về basic
                var account = await _db.Accounts.FindAsync(sub.AccountId);
                if (account != null)
                {
                    account.SubscriptionPlanId = "basic";
                    account.UpdatedAt          = now;
                }

                _logger.LogInformation(
                    "Subscription EXPIRED: Account={AccountId} SubId={SubId}",
                    sub.AccountId, sub.SubscriptionId);
            }

            if (overdues.Count > 0)
                await _db.SaveChangesAsync();
        }
    }
}
