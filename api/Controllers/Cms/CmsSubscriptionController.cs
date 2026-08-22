using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Services;
using System.Security.Claims;

namespace Server.Controllers.Cms
{
    /// <summary>
    /// Quản lý gói đăng ký Owner:
    ///   - Admin: xem danh sách plans, xem/gán subscription cho Owner
    ///   - Owner: xem gói hiện tại của mình, khởi tạo giao dịch nâng cấp
    ///
    /// Luồng nâng gói:
    ///   1. POST /api/cms/subscriptions/upgrade/init   → PENDING tx + VietQR URL
    ///   2. [SePay webhook]                            → tx SUCCESS + subscription activated
    ///   3. GET  /api/cms/subscriptions/upgrade/verify → Web UI poll mỗi 5s → khi SUCCESS refresh sidebar
    /// </summary>
    [ApiController]
    [Route("api/cms/subscriptions")]
    [Authorize]
    public class CmsSubscriptionController : ControllerBase
    {
        private readonly SubscriptionService _subscription;
        private readonly IConfiguration _config;
        private readonly ILogger<CmsSubscriptionController> _logger;

        public CmsSubscriptionController(
            SubscriptionService subscription,
            IConfiguration config,
            ILogger<CmsSubscriptionController> logger)
        {
            _subscription = subscription;
            _config       = config;
            _logger       = logger;
        }

        private string CurrentUserId() =>
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException();

        private bool IsAdmin() => User.IsInRole("Admin");

        // ══════════════════════════════════════════════════════════════════
        //  PLANS
        // ══════════════════════════════════════════════════════════════════

        /// <summary>
        /// GET /api/cms/subscriptions/plans
        /// Owner chỉ thấy gói active. Admin thấy toàn bộ.
        /// </summary>
        [HttpGet("plans")]
        public async Task<IActionResult> GetPlans()
        {
            var plans = await _subscription.GetPlansAsync(IsAdmin());
            return Ok(plans);
        }

        /// <summary>
        /// GET /api/cms/subscriptions/expiring?days=7
        /// Admin: đếm subscriptions sắp hết hạn trong N ngày
        /// </summary>
        [HttpGet("expiring")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetExpiring([FromQuery] int days = 7)
        {
            var count = await _subscription.CountExpiringAsync(days);
            return Ok(new { count, days });
        }

        // ══════════════════════════════════════════════════════════════════
        //  CREATE / UPDATE / TOGGLE / DELETE PLAN  (Admin)
        // ══════════════════════════════════════════════════════════════════

        public class CreatePlanRequest
        {
            public string PlanId { get; set; } = "";
            public string Name { get; set; } = "";
            public decimal Price { get; set; }
            public int DurationDay { get; set; }
            public int MaxPoiCount { get; set; }
            public int AutoPriority { get; set; }
            public List<string> Features { get; set; } = [];
        }

        /// <summary>POST /api/cms/subscriptions/plans — Admin tạo gói mới</summary>
        [HttpPost("plans")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreatePlan([FromBody] CreatePlanRequest req)
        {
            var (plan, error) = await _subscription.CreatePlanAsync(
                req.PlanId, req.Name, req.Price, req.DurationDay,
                req.MaxPoiCount, req.AutoPriority, req.Features);

            if (error != null) return BadRequest(error);

            return Ok(new
            {
                message = "Tạo gói thành công.",
                plan = new
                {
                    plan!.PlanId, plan.Name, plan.Price, plan.DurationDay,
                    plan.MaxPoiCount, plan.AutoPriority, plan.Features, plan.IsActive
                }
            });
        }

        public class UpdatePlanRequest
        {
            public string Name { get; set; } = "";
            public decimal Price { get; set; }
            public int DurationDay { get; set; }
            public int MaxPoiCount { get; set; }
            public int AutoPriority { get; set; }
            public List<string> Features { get; set; } = [];
        }

        /// <summary>PUT /api/cms/subscriptions/plans/{planId} — Admin sửa thông tin gói</summary>
        [HttpPut("plans/{planId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePlan(string planId, [FromBody] UpdatePlanRequest req)
        {
            var (plan, error) = await _subscription.UpdatePlanAsync(
                planId, req.Name, req.Price, req.DurationDay,
                req.MaxPoiCount, req.AutoPriority, req.Features);

            if (error != null) return plan == null ? NotFound(error) : BadRequest(error);

            return Ok(new
            {
                message = "Cập nhật gói thành công.",
                plan = new
                {
                    plan!.PlanId, plan.Name, plan.Price, plan.DurationDay,
                    plan.MaxPoiCount, plan.AutoPriority, plan.Features, plan.IsActive
                }
            });
        }

        /// <summary>PUT /api/cms/subscriptions/plans/{planId}/toggle — Ẩn / hiện gói</summary>
        [HttpPut("plans/{planId}/toggle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> TogglePlanStatus(string planId)
        {
            var (isActive, error) = await _subscription.TogglePlanAsync(planId);
            if (error != null) return isActive == null ? NotFound(error) : BadRequest(error);
            return Ok(new { message = "Cập nhật trạng thái thành công.", planId, isActive });
        }

        /// <summary>
        /// DELETE /api/cms/subscriptions/plans/{planId}
        /// Xóa gói nếu không có ACTIVE sub hoặc PENDING/SUCCESS tx.
        /// </summary>
        [HttpDelete("plans/{planId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePlan(string planId)
        {
            var (success, error, planName) = await _subscription.DeletePlanAsync(planId);
            if (!success)
                return error!.Contains("Không tìm thấy") ? NotFound(error) : BadRequest(error);

            _logger.LogInformation("Admin deleted plan {PlanId}", planId);
            return Ok(new { message = $"Đã xóa gói '{planName}' thành công." });
        }

        // ══════════════════════════════════════════════════════════════════
        //  OWNER — CURRENT SUBSCRIPTION
        // ══════════════════════════════════════════════════════════════════

        /// <summary>GET /api/cms/subscriptions/me — Owner xem gói hiện tại</summary>
        [HttpGet("me")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> GetMySubscription()
        {
            var accountId = CurrentUserId();
            var sub  = await _subscription.GetActiveSubscriptionAsync(accountId);
            var plan = await _subscription.GetCurrentPlanAsync(accountId);

            return Ok(new
            {
                currentPlan = new
                {
                    plan.PlanId, plan.Name, plan.Price,
                    plan.MaxPoiCount, plan.AutoPriority
                },
                activeSubscription = sub == null ? null : new
                {
                    sub.SubscriptionId, sub.Status, sub.StartDate, sub.EndDate, sub.AutoRenew,
                    daysRemaining = (int)(sub.EndDate - DateTime.UtcNow).TotalDays
                }
            });
        }

        /// <summary>
        /// GET /api/cms/subscriptions/poi-grace-status
        /// Owner kiểm tra xem có đang trong grace period sau downgrade không.
        /// Frontend dùng để hiển thị banner cảnh báo trên trang POI.
        /// </summary>
        [HttpGet("poi-grace-status")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> GetPoiGraceStatus()
        {
            var accountId = CurrentUserId();
            var status = await _subscription.GetPoiGracePeriodStatusAsync(accountId);

            if (status == null)
                return Ok(new { inGracePeriod = false });

            return Ok(new
            {
                inGracePeriod = true,
                graceUntil    = status.GraceUntil,
                hoursLeft     = status.HoursLeft,
                activePois    = status.ActivePois,
                maxAllowed    = status.MaxAllowed,
                excessPois    = status.ExcessPois,
                planName      = status.PlanName,
                message       = $"Gói {status.PlanName} chỉ cho phép tối đa {status.MaxAllowed} POI. " +
                               $"Bạn đang có {status.ActivePois} POI ({status.ExcessPois} vượt giới hạn). " +
                               $"Hệ thống sẽ tự ẩn POI thừa sau {status.HoursLeft} giờ nữa nếu bạn không tự xử lý."
            });
        }

        // ══════════════════════════════════════════════════════════════════
        //  KHỞI TẠO GIAO DỊCH NÂNG GÓI
        // ══════════════════════════════════════════════════════════════════

        public record InitUpgradeRequest(string PlanId, string Gateway);

        /// <summary>POST /api/cms/subscriptions/upgrade/init — Owner init nâng gói</summary>
        [HttpPost("upgrade/init")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> InitUpgrade([FromBody] InitUpgradeRequest req)
        {
            var accountId    = CurrentUserId();
            var useTestAmount = _config.GetValue<bool>("SubscriptionPayment:UseTestAmount");
            var testAmountVnd = _config.GetValue<decimal>("SubscriptionPayment:TestAmountVnd", 2000);

            var result = await _subscription.InitUpgradeAsync(
                accountId, req.PlanId, req.Gateway, useTestAmount, testAmountVnd);

            if (result.Error != null) return BadRequest(result.Error);

            var bankAccountNo = _subscription.ResolveBankAccountNo(_config);
            var bankName      = _subscription.ResolveBankName(_config);

            return Ok(_subscription.BuildOwnerInitResponse(
                result.Transaction!, result.Plan!, useTestAmount, bankAccountNo, bankName));
        }

        // ══════════════════════════════════════════════════════════════════
        //  VERIFY TRẠNG THÁI THANH TOÁN
        // ══════════════════════════════════════════════════════════════════

        /// <summary>
        /// GET /api/cms/subscriptions/upgrade/verify?transactionId=AG-...
        /// Owner poll mỗi 5s để biết SePay đã xác nhận chưa.
        /// </summary>
        [HttpGet("upgrade/verify")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> VerifyUpgrade([FromQuery] string transactionId)
        {
            var accountId = CurrentUserId();
            var (result, error) = await _subscription.VerifyUpgradeAsync(accountId, transactionId);

            if (error != null)
                return error.Contains("bắt buộc") ? BadRequest(error) : NotFound(error);

            return Ok(new
            {
                status        = result!.Status,
                message       = result.Message,
                planName      = result.PlanName,
                endDate       = result.EndDate,
                daysRemaining = result.DaysRemaining
            });
        }

        // ══════════════════════════════════════════════════════════════════
        //  ADMIN — OWNER SUBSCRIPTION MANAGEMENT
        // ══════════════════════════════════════════════════════════════════

        /// <summary>GET /api/cms/subscriptions/owner/{accountId} — Admin xem lịch sử sub của Owner</summary>
        [HttpGet("owner/{accountId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetOwnerSubscription(string accountId)
        {
            var subs = await _subscription.GetOwnerSubscriptionHistoryAsync(accountId);
            return Ok(subs);
        }

        /// <summary>POST /api/cms/subscriptions/owner/{accountId}/assign — Admin gán gói cho Owner</summary>
        [HttpPost("owner/{accountId}/assign")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignPlan(
            string accountId, [FromBody] InitUpgradeRequest req)
        {
            var (result, error) = await _subscription.AssignPlanAsync(accountId, req.PlanId);
            if (error != null)
                return error.Contains("Không tìm thấy") ? NotFound(error) : BadRequest(error);

            return Ok(new
            {
                message        = result!.Message,
                subscriptionId = result.SubscriptionId,
                transactionId  = result.TransactionId,
                endDate        = result.EndDate
            });
        }
    }
}