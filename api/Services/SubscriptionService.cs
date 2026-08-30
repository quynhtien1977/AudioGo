using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services
{
    /// <summary>
    /// Xử lý nghiệp vụ gói đăng ký Owner:
    ///   - Gán / gia hạn gói cho Owner
    ///   - Hạ Priority POI khi subscription hết hạn
    ///   - Kiểm tra giới hạn POI trước khi tạo mới
    ///   - Quản lý Plan (CRUD, toggle, delete) — admin operations
    ///   - Init/Verify upgrade transaction + VietQR
    ///   - Admin assign plan trực tiếp cho Owner
    /// </summary>
    public class SubscriptionService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<SubscriptionService> _logger;
        private readonly INotificationService _notifications;

        public SubscriptionService(
            AppDbContext db,
            ILogger<SubscriptionService> logger,
            INotificationService notifications)
        {
            _db            = db;
            _logger        = logger;
            _notifications = notifications;
        }

        // ══════════════════════════════════════════════════════════════════════
        //  QUERY — CURRENT PLAN & ACTIVE SUBSCRIPTION
        // ══════════════════════════════════════════════════════════════════════

        /// <summary>Lấy subscription đang ACTIVE của Owner (null nếu không có).</summary>
        public async Task<OwnerSubscription?> GetActiveSubscriptionAsync(string accountId)
        {
            return await _db.OwnerSubscriptions
                .Include(s => s.Plan)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.AccountId == accountId && s.Status == "ACTIVE");
        }

        /// <summary>
        /// Lấy plan hiện tại. Ưu tiên OwnerSubscription ACTIVE thực tế,
        /// KHÔNG dùng Account.SubscriptionPlanId (shortcut) vì có thể stale.
        /// </summary>
        public async Task<SubscriptionPlan> GetCurrentPlanAsync(string accountId)
        {
            var activeSub = await _db.OwnerSubscriptions
                .Include(s => s.Plan)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.AccountId == accountId
                                       && s.Status == "ACTIVE"
                                       && s.EndDate > DateTime.UtcNow);

            if (activeSub?.Plan != null)
                return activeSub.Plan;

            return await _db.SubscriptionPlans.FirstAsync(p => p.PlanId == "basic");
        }

        // ══════════════════════════════════════════════════════════════════════
        //  POI LIMIT CHECK
        // ══════════════════════════════════════════════════════════════════════

        /// <returns>null = được phép tạo thêm; string = thông báo lỗi khi vượt giới hạn</returns>
        public async Task<string?> CheckPoiLimitAsync(string accountId)
        {
            var plan = await GetCurrentPlanAsync(accountId);

            if (plan.MaxPoiCount == -1) // -1 = unlimited
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

        // ══════════════════════════════════════════════════════════════════════
        //  ACTIVATE / EXPIRE SUBSCRIPTION
        // ══════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Gán / gia hạn subscription sau khi thanh toán thành công.
        /// - Downgrade (giảm MaxPoiCount): hạ priority ngay, nhưng KHÔNG ẩn POI ngay.
        ///   Đặt grace period 3 ngày để owner tự xử lý (xóa bớt hoặc upgrade lại).
        ///   Sau 3 ngày, PoiLimitEnforcementService sẽ tự ẩn POI thừa.
        /// </summary>
        public async Task<OwnerSubscription> ActivateSubscriptionAsync(
            string accountId, string planId, string triggeredByTransactionId)
        {
            var plan = await _db.SubscriptionPlans.FindAsync(planId)
                ?? throw new ArgumentException($"PlanId '{planId}' không tồn tại.");
            var account = await _db.Accounts.FindAsync(accountId)
                ?? throw new ArgumentException($"AccountId '{accountId}' không tồn tại.");

            var existingActive = await _db.OwnerSubscriptions
                .Include(s => s.Plan)
                .FirstOrDefaultAsync(s => s.AccountId == accountId && s.Status == "ACTIVE");

            DateTime? gracePeriodUntil = null;

            if (existingActive != null)
            {
                existingActive.Status    = "CANCELLED";
                existingActive.UpdatedAt = DateTime.UtcNow;

                var oldPlan = existingActive.Plan
                    ?? await _db.SubscriptionPlans.FindAsync(existingActive.PlanId);

                if (oldPlan != null && plan.AutoPriority != oldPlan.AutoPriority)
                {
                    // Cập nhật priority tất cả POI theo plan mới (cả upgrade lẩn downgrade)
                    await SetPoiPriorityAsync(accountId, plan.AutoPriority, onlyLower: plan.AutoPriority < oldPlan.AutoPriority);
                }

                // Kiểm tra xem POI count có vượt giới hạn mới không
                // MaxPoiCount = -1 → unlimited, không cần grace period
                if (plan.MaxPoiCount >= 0 && oldPlan != null &&
                    (oldPlan.MaxPoiCount == -1 || plan.MaxPoiCount < oldPlan.MaxPoiCount))
                {
                    var activePoiCount = await _db.Pois
                        .CountAsync(p => p.AccountId == accountId && p.IsActive);

                    if (activePoiCount > plan.MaxPoiCount)
                    {
                        // Set grace period 3 ngày — KHÔNG ẩn POI ngay
                        gracePeriodUntil = DateTime.UtcNow.AddDays(3);
                        _logger.LogWarning(
                            "Downgrade with excess POIs: Account={AccountId} OldPlan={OldPlan} NewPlan={NewPlan} " +
                            "ActivePois={Count} MaxAllowed={Max}. Grace period until {Grace}.",
                            accountId, oldPlan.PlanId, planId, activePoiCount, plan.MaxPoiCount, gracePeriodUntil);
                    }
                }
            }

            var newSub = new OwnerSubscription
            {
                SubscriptionId     = Guid.NewGuid().ToString(),
                AccountId          = accountId,
                PlanId             = planId,
                Status             = "ACTIVE",
                StartDate          = DateTime.UtcNow,
                EndDate            = DateTime.UtcNow.AddDays(plan.DurationDay),
                AutoRenew          = false,
                PoiGracePeriodUntil = gracePeriodUntil,
                CreatedAt          = DateTime.UtcNow
            };
            _db.OwnerSubscriptions.Add(newSub);

            account.SubscriptionPlanId = planId;
            account.UpdatedAt          = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "Subscription activated: Account={AccountId} Plan={PlanId} SubId={SubId} TxId={TxId} GracePeriod={Grace}",
                accountId, planId, newSub.SubscriptionId, triggeredByTransactionId, gracePeriodUntil?.ToString("o") ?? "none");

            // ── Notification cho Owner khi gói được kích hoạt (trừ khi gọi bởi AssignPlanAsync — sẽ notify riêng) ──
            try
            {
                await _notifications.CreateAsync(
                    recipientAccountId: accountId,
                    type:  "PlanAssigned",
                    title: "Gói đăng ký đã được kích hoạt",
                    body:  $"Gói '{plan.Name}' của bạn đã được kích hoạt thành công. Hiệu lực {plan.DurationDay} ngày.");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Notification] Failed to create PlanAssigned notification for account {AccountId}", accountId);
            }

            return newSub;
        }

        /// <summary>
        /// Lấy trạng thái grace period POI của Owner hiện tại.
        /// Trả về thông tin để frontend hiển thị banner cảnh báo.
        /// </summary>
        public async Task<PoiGracePeriodStatus?> GetPoiGracePeriodStatusAsync(string accountId)
        {
            var activeSub = await _db.OwnerSubscriptions
                .Include(s => s.Plan)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.AccountId == accountId && s.Status == "ACTIVE");

            if (activeSub?.PoiGracePeriodUntil == null)
                return null;

            // Grace period đã qua (background job sẽ xử lý nó, hoặc đã xử lý rồi)
            if (activeSub.PoiGracePeriodUntil < DateTime.UtcNow)
                return null;

            var activePoiCount = await _db.Pois
                .CountAsync(p => p.AccountId == accountId && p.IsActive);

            var maxPoiCount = activeSub.Plan?.MaxPoiCount ?? 0;

            if (activePoiCount <= maxPoiCount)
            {
                // Đã tự giải quyết xong — không cần hiển thị banner
                return null;
            }

            return new PoiGracePeriodStatus(
                GraceUntil : activeSub.PoiGracePeriodUntil.Value,
                ActivePois : activePoiCount,
                MaxAllowed : maxPoiCount,
                ExcessPois : activePoiCount - maxPoiCount,
                PlanName   : activeSub.Plan?.Name ?? activeSub.PlanId,
                HoursLeft  : (int)(activeSub.PoiGracePeriodUntil.Value - DateTime.UtcNow).TotalHours
            );
        }

        public record PoiGracePeriodStatus(
            DateTime GraceUntil, int ActivePois, int MaxAllowed, int ExcessPois,
            string PlanName, int HoursLeft);

        /// <summary>
        /// Background job: Tìm ACTIVE subscription đã qua EndDate → EXPIRED + hạ Priority POI.
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
                await DowngradePoiPriorityAsync(sub.AccountId, 1);

                var account = await _db.Accounts.FindAsync(sub.AccountId);
                if (account != null)
                {
                    account.SubscriptionPlanId = "basic";
                    account.UpdatedAt          = now;
                }

                _logger.LogInformation("Subscription EXPIRED: Account={AccountId} SubId={SubId}",
                    sub.AccountId, sub.SubscriptionId);
            }

            if (overdues.Count > 0)
                await _db.SaveChangesAsync();
        }

        /// <summary>
        /// Cập nhật priority tất cả POI active của account theo giá trị mới.
        /// onlyLower = true: chỉ hạ những POI đang cao hơn (downgrade path).
        /// onlyLower = false: đặt tất cả về giá trị mới — dùng khi upgrade.
        /// </summary>
        private async Task SetPoiPriorityAsync(string accountId, int newPriority, bool onlyLower = false)
        {
            IQueryable<Poi> query = _db.Pois
                .Where(p => p.AccountId == accountId && p.IsActive);

            if (onlyLower)
                // Downgrade: chỉ hạ những POI đang cao hơn giới hạn mới
                query = query.Where(p => p.Priority > newPriority);
            // Upgrade: cập nhật tất cả (cả thấp hơn) vì plan mới cho phép priority cao hơn

            var pois = await query.ToListAsync();
            foreach (var poi in pois)
            {
                poi.Priority  = newPriority;
                poi.UpdatedAt = DateTime.UtcNow;
            }

            if (pois.Count > 0)
                _logger.LogInformation(
                    "{Action} priority for {Count} POIs of Account={AccountId} to {Priority}",
                    onlyLower ? "Downgraded" : "Upgraded", pois.Count, accountId, newPriority);
        }

        // Ựu ý: vẫn giữ hàm cũ để ExpireOverdueSubscriptionsAsync dùng
        private Task DowngradePoiPriorityAsync(string accountId, int newPriority)
            => SetPoiPriorityAsync(accountId, newPriority, onlyLower: true);

        // ══════════════════════════════════════════════════════════════════════
        //  PLAN MANAGEMENT  (Admin)
        // ══════════════════════════════════════════════════════════════════════

        /// <summary>Lấy danh sách gói. Admin thấy tất cả, Owner chỉ thấy active.</summary>
        public async Task<List<object>> GetPlansAsync(bool isAdmin)
        {
            IQueryable<SubscriptionPlan> query = _db.SubscriptionPlans;
            if (!isAdmin)
                query = query.Where(p => p.IsActive);

            return await query
                .OrderBy(p => p.AutoPriority)
                .Select(p => (object)new
                {
                    p.PlanId, p.Name, p.Price, p.DurationDay,
                    p.MaxPoiCount, p.AutoPriority, p.Features, p.IsActive
                })
                .ToListAsync();
        }

        /// <summary>Admin đếm subscriptions sắp hết hạn trong N ngày.</summary>
        public async Task<int> CountExpiringAsync(int days)
        {
            var cutoff = DateTime.UtcNow.AddDays(days);
            return await _db.OwnerSubscriptions
                .CountAsync(s => s.Status == "ACTIVE"
                              && s.EndDate <= cutoff
                              && s.EndDate > DateTime.UtcNow);
        }

        /// <summary>Admin tạo gói mới. (plan, null) = thành công; (null, error) = thất bại.</summary>
        public async Task<(SubscriptionPlan? plan, string? error)> CreatePlanAsync(
            string planId, string name, decimal price, int durationDay,
            int maxPoiCount, int autoPriority, List<string> features)
        {
            if (string.IsNullOrWhiteSpace(planId))
                return (null, "PlanId không được để trống.");
            if (string.IsNullOrWhiteSpace(name))
                return (null, "Tên gói không được để trống.");
            if (await _db.SubscriptionPlans.AnyAsync(p => p.PlanId == planId))
                return (null, $"PlanId '{planId}' đã tồn tại.");

            var plan = new SubscriptionPlan
            {
                PlanId       = planId.Trim(),
                Name         = name.Trim(),
                Price        = price < 0 ? 0 : price,
                DurationDay  = durationDay <= 0 ? 30 : durationDay,
                MaxPoiCount  = maxPoiCount < 0 ? 0 : maxPoiCount,
                AutoPriority = Math.Clamp(autoPriority, 1, 4),
                Features     = System.Text.Json.JsonSerializer.Serialize(features),
                IsActive     = true
            };

            _db.SubscriptionPlans.Add(plan);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Admin created subscription plan {PlanId}", planId);
            return (plan, null);
        }

        /// <summary>Admin cập nhật thông tin gói.</summary>
        public async Task<(SubscriptionPlan? plan, string? error)> UpdatePlanAsync(
            string planId, string name, decimal price, int durationDay,
            int maxPoiCount, int autoPriority, List<string> features)
        {
            var plan = await _db.SubscriptionPlans.FindAsync(planId);
            if (plan == null)
                return (null, "Không tìm thấy gói.");

            plan.Name         = name;
            plan.Price        = price;
            plan.DurationDay  = durationDay;
            plan.MaxPoiCount  = maxPoiCount;
            plan.AutoPriority = autoPriority;
            plan.Features     = System.Text.Json.JsonSerializer.Serialize(features);

            await _db.SaveChangesAsync();
            _logger.LogInformation("Admin updated subscription plan {PlanId}", planId);
            return (plan, null);
        }

        /// <summary>Admin toggle ẩn/hiện gói.</summary>
        public async Task<(bool? isActive, string? error)> TogglePlanAsync(string planId)
        {
            var plan = await _db.SubscriptionPlans.FindAsync(planId);
            if (plan == null)
                return (null, "Không tìm thấy gói.");

            plan.IsActive = !plan.IsActive;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Admin toggled plan {PlanId} → IsActive={IsActive}", planId, plan.IsActive);
            return (plan.IsActive, null);
        }

        /// <summary>
        /// Admin xóa gói:
        ///   - Chặn nếu có OwnerSubscription ACTIVE hoặc PaymentTransaction PENDING/SUCCESS
        ///   - Dọn FK non-blocking (FAILED/EXPIRED/CANCELLED) rồi xóa vĩnh viễn
        /// </summary>
        public async Task<(bool success, string? error, string? planName)> DeletePlanAsync(string planId)
        {
            var plan = await _db.SubscriptionPlans.FindAsync(planId);
            if (plan == null)
                return (false, "Không tìm thấy gói.", null);

            if (await _db.OwnerSubscriptions.AnyAsync(s => s.PlanId == planId && s.Status == "ACTIVE"))
                return (false, "Không thể xóa gói đang có người dùng hoạt động (ACTIVE). Hãy ẩn gói thay vì xóa.", null);

            if (await _db.PaymentTransactions.AnyAsync(t => t.PlanId == planId && (t.Status == "PENDING" || t.Status == "SUCCESS")))
                return (false, "Không thể xóa gói đã có giao dịch thành công hoặc đang chờ xử lý. Hãy ẩn gói để bảo toàn dữ liệu lịch sử.", null);

            var nonBlockingTx = await _db.PaymentTransactions
                .Where(t => t.PlanId == planId && t.Status != "SUCCESS" && t.Status != "PENDING")
                .ToListAsync();
            if (nonBlockingTx.Count > 0)
                _db.PaymentTransactions.RemoveRange(nonBlockingTx);

            var nonActiveSubs = await _db.OwnerSubscriptions
                .Where(s => s.PlanId == planId && s.Status != "ACTIVE")
                .ToListAsync();
            if (nonActiveSubs.Count > 0)
                _db.OwnerSubscriptions.RemoveRange(nonActiveSubs);

            var accountsWithPlan = await _db.Accounts
                .Where(a => a.SubscriptionPlanId == planId)
                .ToListAsync();
            foreach (var acc in accountsWithPlan)
                acc.SubscriptionPlanId = "basic";

            var planName = plan.Name;
            _db.SubscriptionPlans.Remove(plan);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Admin deleted subscription plan {PlanId}", planId);
            return (true, null, planName);
        }

        // ══════════════════════════════════════════════════════════════════════
        //  ADMIN — OWNER SUBSCRIPTION MANAGEMENT
        // ══════════════════════════════════════════════════════════════════════

        /// <summary>Admin xem toàn bộ lịch sử subscription của 1 Owner.</summary>
        public async Task<List<object>> GetOwnerSubscriptionHistoryAsync(string accountId)
        {
            return await _db.OwnerSubscriptions
                .Include(s => s.Plan)
                .Where(s => s.AccountId == accountId)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => (object)new
                {
                    s.SubscriptionId,
                    s.PlanId,
                    PlanName = s.Plan!.Name,
                    s.Status,
                    s.StartDate,
                    s.EndDate,
                    s.AutoRenew,
                    s.CreatedAt
                })
                .ToListAsync();
        }

        public record AssignPlanResult(
            string Message,
            string SubscriptionId,
            string TransactionId,
            DateTime EndDate);

        /// <summary>Admin gán gói cho Owner (tạo MANUAL tx SUCCESS + activate subscription).</summary>
        public async Task<(AssignPlanResult? result, string? error)> AssignPlanAsync(
            string accountId, string planId)
        {
            var account = await _db.Accounts.FindAsync(accountId);
            if (account == null)
                return (null, "Không tìm thấy tài khoản.");

            var plan = await _db.SubscriptionPlans.FindAsync(planId);
            if (plan == null || !plan.IsActive)
                return (null, $"Gói '{planId}' không hợp lệ.");

            var txId = GenerateTransactionId();
            var tx = new PaymentTransaction
            {
                TransactionId = txId,
                PaymentType   = "OWNER_SUBSCRIPTION",
                AccountId     = accountId,
                PlanId        = planId,
                Amount        = 0,
                Currency      = "VND",
                Gateway       = "MANUAL",
                Status        = "SUCCESS",
                CreatedAt     = DateTime.UtcNow,
                CompletedAt   = DateTime.UtcNow
            };
            _db.PaymentTransactions.Add(tx);
            await _db.SaveChangesAsync();

            var sub = await ActivateSubscriptionAsync(accountId, planId, txId);

            tx.SubscriptionId = sub.SubscriptionId;
            await _db.SaveChangesAsync();

            _logger.LogInformation("Admin assigned plan {PlanId} to account {AccountId}. Tx={TxId} Sub={SubId}",
                planId, accountId, txId, sub.SubscriptionId);

            return (new AssignPlanResult(
                $"Đã gán gói '{plan.Name}' cho tài khoản thành công.",
                sub.SubscriptionId, txId, sub.EndDate), null);
        }

        // ══════════════════════════════════════════════════════════════════════
        //  UPGRADE / PAYMENT TRANSACTION  (Owner)
        // ══════════════════════════════════════════════════════════════════════

        public record InitUpgradeResult(
            PaymentTransaction? Transaction,
            SubscriptionPlan? Plan,
            string? Error = null);

        /// <summary>
        /// Owner khởi tạo giao dịch nâng gói.
        /// Tái sử dụng PENDING tx trong 15 phút (idempotency) để tránh rác DB.
        /// </summary>
        public async Task<InitUpgradeResult> InitUpgradeAsync(
            string accountId, string planId, string gateway,
            bool useTestAmount, decimal testAmountVnd)
        {
            if (gateway != "SEPAY")
                return new InitUpgradeResult(null, null, "Hiện tại chỉ hỗ trợ gateway 'SEPAY'.");

            var plan = await _db.SubscriptionPlans.FindAsync(planId);
            if (plan == null || !plan.IsActive)
                return new InitUpgradeResult(null, null, $"Gói '{planId}' không hợp lệ hoặc không còn hoạt động.");

            var existingTx = await _db.PaymentTransactions
                .Where(t => t.AccountId == accountId
                         && t.PlanId == planId
                         && t.Status == "PENDING"
                         && t.PaymentType == "OWNER_SUBSCRIPTION"
                         && t.CreatedAt >= DateTime.UtcNow.AddMinutes(-15))
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (existingTx != null)
            {
                _logger.LogInformation("Owner upgrade init reused pending tx. Account={AccountId} Tx={TxId} Plan={PlanId}",
                    accountId, existingTx.TransactionId, planId);
                return new InitUpgradeResult(existingTx, plan);
            }

            var chargeAmount = useTestAmount
                ? (testAmountVnd > 0 ? testAmountVnd : 2000)
                : plan.Price;

            var tx = new PaymentTransaction
            {
                TransactionId = GenerateTransactionId(),
                PaymentType   = "OWNER_SUBSCRIPTION",
                AccountId     = accountId,
                PlanId        = planId,
                Amount        = chargeAmount,
                Currency      = "VND",
                Gateway       = gateway,
                Status        = "PENDING",
                CreatedAt     = DateTime.UtcNow
            };

            _db.PaymentTransactions.Add(tx);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Owner upgrade init created new tx. Account={AccountId} Tx={TxId} Plan={PlanId} Amount={Amount}",
                accountId, tx.TransactionId, planId, chargeAmount);

            return new InitUpgradeResult(tx, plan);
        }

        public record VerifyUpgradeResult(
            string Status, string Message,
            string? PlanName = null, DateTime? EndDate = null, int? DaysRemaining = null);

        /// <summary>
        /// Owner verify trạng thái thanh toán theo đúng transactionId.
        /// Không dùng fallback theo planId vì gây false-positive khi user retry cùng plan.
        /// Webhook SePay có trách nhiệm set đúng tx thành SUCCESS theo transactionId trong nội dung CK.
        /// </summary>
        public async Task<(VerifyUpgradeResult? result, string? error)> VerifyUpgradeAsync(
            string accountId, string transactionId)
        {
            if (string.IsNullOrWhiteSpace(transactionId))
                return (null, "transactionId là bắt buộc.");

            var tx = await _db.PaymentTransactions
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.TransactionId == transactionId
                                       && t.PaymentType   == "OWNER_SUBSCRIPTION"
                                       && t.AccountId     == accountId);

            if (tx == null)
                return (null, "Không tìm thấy giao dịch.");

            // Chỉ tin vào transactionId được set bởi webhook SePay — không fallback theo planId
            if (tx.Status != "SUCCESS")
            {
                var msg = tx.Status switch
                {
                    "PENDING" => "Đang chờ xác nhận thanh toán...",
                    "FAILED"  => "Giao dịch thất bại. Vui lòng thử lại.",
                    "EXPIRED" => "Giao dịch đã hết hạn. Vui lòng tạo QR mới.",
                    _         => $"Trạng thái: {tx.Status}"
                };
                return (new VerifyUpgradeResult(tx.Status, msg), null);
            }

            var sub = await _db.OwnerSubscriptions
                .Include(s => s.Plan)
                .Where(s => s.AccountId == accountId && s.Status == "ACTIVE")
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            _logger.LogInformation("Owner upgrade verified SUCCESS. Account={AccountId} Tx={TxId}",
                accountId, tx.TransactionId);

            var daysRemaining = sub == null
                ? (int?)null
                : (int)(sub.EndDate - DateTime.UtcNow).TotalDays;

            return (new VerifyUpgradeResult(
                "SUCCESS", "Thanh toán thành công! Gói đã được kích hoạt.",
                sub?.Plan?.Name ?? tx.PlanId, sub?.EndDate, daysRemaining), null);
        }

        // ══════════════════════════════════════════════════════════════════════
        //  HELPERS
        // ══════════════════════════════════════════════════════════════════════

        /// <summary>Xây dựng response VietQR sau khi init upgrade.</summary>
        public object BuildOwnerInitResponse(
            PaymentTransaction tx, SubscriptionPlan plan,
            bool useTestAmount, string bankAccountNo, string bankName)
        {
            var transferContent = $"Nang goi AudioGo {tx.TransactionId}";
            var encodedContent  = Uri.EscapeDataString(transferContent);
            var vietQrUrl       = $"https://img.vietqr.io/image/TPB-{bankAccountNo}-compact2.png"
                                + $"?amount={tx.Amount:F0}"
                                + $"&addInfo={encodedContent}"
                                + $"&accountName=AUDIOGO";
            return new
            {
                transactionId      = tx.TransactionId,
                amount             = tx.Amount,
                originalPlanAmount = plan.Price,
                isTestAmount       = useTestAmount,
                planName           = plan.Name,
                gateway            = tx.Gateway,
                bankAccount        = bankAccountNo,
                bankName,
                transferContent,
                vietQrUrl,
                expireInMinutes    = 15
            };
        }

        public static string GenerateTransactionId()
        {
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            var random    = Guid.NewGuid().ToString("N")[..6].ToUpper();
            return $"AG-{timestamp}-{random}";
        }

        private static string FirstNonEmpty(params string?[] values)
        {
            foreach (var v in values)
                if (!string.IsNullOrWhiteSpace(v))
                    return v!.Trim();
            return string.Empty;
        }

        public string ResolveBankAccountNo(IConfiguration config) =>
            FirstNonEmpty(
                config["SubscriptionPayment:BankAccountNo"],
                config["TouristAccess:BankAccountNo"],
                "24200502218");

        public string ResolveBankName(IConfiguration config) =>
            FirstNonEmpty(config["SubscriptionPayment:BankName"], "TP Bank");
    }
}
