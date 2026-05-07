using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services;
using System.Security.Claims;

namespace Server.Controllers.Cms
{
    /// <summary>
    /// Quản lý gói đăng ký Owner:
    ///   - Admin: xem danh sách plans, xem/gán subscription cho Owner
    ///   - Owner: xem gói hiện tại của mình, khởi tạo giao dịch nâng cấp
    /// </summary>
    [ApiController]
    [Route("api/cms/subscriptions")]
    [Authorize]
    public class CmsSubscriptionController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly SubscriptionService _subscription;
        private readonly IConfiguration _config;

        public CmsSubscriptionController(
            AppDbContext db,
            SubscriptionService subscription,
            IConfiguration config
        )
        {
            _db = db;
            _subscription = subscription;
            _config = config;
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
        /// Owner chỉ thấy gói active
        /// Admin thấy toàn bộ
        /// </summary>
        [HttpGet("plans")]
        public async Task<IActionResult> GetPlans()
        {
            IQueryable<SubscriptionPlan> query =
                _db.SubscriptionPlans;

            if (!IsAdmin())
            {
                query = query.Where(p => p.IsActive);
            }

            var plans = await query
                .OrderBy(p => p.AutoPriority)
                .Select(p => new
                {
                    p.PlanId,
                    p.Name,
                    p.Price,
                    p.DurationDay,
                    p.MaxPoiCount,
                    p.AutoPriority,
                    p.Features,
                    p.IsActive
                })
                .ToListAsync();

            return Ok(plans);
        }

        // ══════════════════════════════════════════════════════════════════
        //  CREATE PLAN
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

        /// <summary>
        /// POST /api/cms/subscriptions/plans
        /// Admin tạo gói subscription mới
        /// </summary>
        [HttpPost("plans")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreatePlan(
            [FromBody] CreatePlanRequest req
        )
        {
            if (string.IsNullOrWhiteSpace(req.PlanId))
            {
                return BadRequest(
                    "PlanId không được để trống."
                );
            }

            if (string.IsNullOrWhiteSpace(req.Name))
            {
                return BadRequest(
                    "Tên gói không được để trống."
                );
            }

            var existed = await _db.SubscriptionPlans
                .AnyAsync(p => p.PlanId == req.PlanId);

            if (existed)
            {
                return BadRequest(
                    $"PlanId '{req.PlanId}' đã tồn tại."
                );
            }

            var plan = new SubscriptionPlan
            {
                PlanId = req.PlanId.Trim(),

                Name = req.Name.Trim(),

                Price = req.Price < 0
                    ? 0
                    : req.Price,

                DurationDay = req.DurationDay <= 0
                    ? 30
                    : req.DurationDay,

                MaxPoiCount = req.MaxPoiCount < 0
                    ? 0
                    : req.MaxPoiCount,

                AutoPriority =
                    Math.Clamp(req.AutoPriority, 1, 4),

                Features = System.Text.Json.JsonSerializer
                    .Serialize(req.Features),

                IsActive = true
            };

            _db.SubscriptionPlans.Add(plan);

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo gói thành công.",

                plan = new
                {
                    plan.PlanId,
                    plan.Name,
                    plan.Price,
                    plan.DurationDay,
                    plan.MaxPoiCount,
                    plan.AutoPriority,
                    plan.Features,
                    plan.IsActive
                }
            });
        }

        // ══════════════════════════════════════════════════════════════════
        //  ADMIN UPDATE PLAN
        // ══════════════════════════════════════════════════════════════════

        public class UpdatePlanRequest
        {
            public string Name { get; set; } = "";

            public decimal Price { get; set; }

            public int DurationDay { get; set; }

            public int MaxPoiCount { get; set; }

            public int AutoPriority { get; set; }

            public List<string> Features { get; set; } = [];
        }

        /// <summary>
        /// PUT /api/cms/subscriptions/plans/{planId}
        /// Admin sửa thông tin gói
        /// </summary>
        [HttpPut("plans/{planId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePlan(
            string planId,
            [FromBody] UpdatePlanRequest req
        )
        {
            var plan = await _db.SubscriptionPlans
                .FindAsync(planId);

            if (plan == null)
            {
                return NotFound("Không tìm thấy gói.");
            }

            plan.Name = req.Name;
            plan.Price = req.Price;
            plan.DurationDay = req.DurationDay;
            plan.MaxPoiCount = req.MaxPoiCount;
            plan.AutoPriority = req.AutoPriority;

            plan.Features = System.Text.Json.JsonSerializer
                .Serialize(req.Features);

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật gói thành công.",

                plan = new
                {
                    plan.PlanId,
                    plan.Name,
                    plan.Price,
                    plan.DurationDay,
                    plan.MaxPoiCount,
                    plan.AutoPriority,
                    plan.Features,
                    plan.IsActive
                }
            });
        }

        // ══════════════════════════════════════════════════════════════════
        //  ADMIN TOGGLE PLAN STATUS
        // ══════════════════════════════════════════════════════════════════

        /// <summary>
        /// PUT /api/cms/subscriptions/plans/{planId}/toggle
        /// Ẩn / hiện gói
        /// </summary>
        [HttpPut("plans/{planId}/toggle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> TogglePlanStatus(string planId)
        {
            var plan = await _db.SubscriptionPlans
                .FindAsync(planId);

            if (plan == null)
            {
                return NotFound("Không tìm thấy gói.");
            }

            plan.IsActive = !plan.IsActive;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật trạng thái thành công.",
                planId = plan.PlanId,
                isActive = plan.IsActive
            });
        }

        // ══════════════════════════════════════════════════════════════════
        //  OWNER CURRENT SUBSCRIPTION
        // ══════════════════════════════════════════════════════════════════

        [HttpGet("me")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> GetMySubscription()
        {
            var accountId = CurrentUserId();

            var sub = await _subscription
                .GetActiveSubscriptionAsync(accountId);

            var plan = await _subscription
                .GetCurrentPlanAsync(accountId);

            return Ok(new
            {
                currentPlan = new
                {
                    plan.PlanId,
                    plan.Name,
                    plan.Price,
                    plan.MaxPoiCount,
                    plan.AutoPriority
                },

                activeSubscription = sub == null
                    ? null
                    : new
                    {
                        sub.SubscriptionId,
                        sub.Status,
                        sub.StartDate,
                        sub.EndDate,
                        sub.AutoRenew,

                        daysRemaining =
                            (int)(sub.EndDate - DateTime.UtcNow)
                            .TotalDays
                    }
            });
        }

        // ══════════════════════════════════════════════════════════════════
        //  KHỞI TẠO GIAO DỊCH NÂNG GÓI
        // ══════════════════════════════════════════════════════════════════

        public record InitUpgradeRequest(
            string PlanId,
            string Gateway
        );

        [HttpPost("upgrade/init")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> InitUpgrade(
            [FromBody] InitUpgradeRequest req
        )
        {
            var accountId = CurrentUserId();

            var plan = await _db.SubscriptionPlans
                .FindAsync(req.PlanId);

            if (plan == null || !plan.IsActive)
            {
                return BadRequest(
                    $"Gói '{req.PlanId}' không hợp lệ hoặc không còn hoạt động."
                );
            }

            if (
                req.Gateway != "SEPAY" &&
                req.Gateway != "MOMO"
            )
            {
                return BadRequest(
                    "Gateway phải là 'SEPAY' hoặc 'MOMO'."
                );
            }

            var txId = GenerateTransactionId();
            var useTestAmount = _config.GetValue<bool>("SubscriptionPayment:UseTestAmount");
            var testAmountVnd = _config.GetValue<decimal>("SubscriptionPayment:TestAmountVnd", 2000);
            var chargeAmount = useTestAmount
                ? (testAmountVnd > 0 ? testAmountVnd : 2000)
                : plan.Price;
            var bankAccount =
                FirstNonEmpty(
                    _config["SubscriptionPayment:BankAccountNo"],
                    _config["TouristAccess:BankAccountNo"],
                    "24200502218"
                );
            var bankName =
                FirstNonEmpty(
                    _config["SubscriptionPayment:BankName"],
                    "TP Bank"
                );
            var transferContent = $"Nang goi AudioGo {txId}";
            var encodedContent = Uri.EscapeDataString(transferContent);
            var vietQrUrl = $"https://img.vietqr.io/image/TPB-{bankAccount}-compact2.png" +
                            $"?amount={chargeAmount:F0}" +
                            $"&addInfo={encodedContent}" +
                            $"&accountName=AUDIOGO";

            var tx = new PaymentTransaction
            {
                TransactionId = txId,
                PaymentType = "OWNER_SUBSCRIPTION",
                AccountId = accountId,
                PlanId = req.PlanId,
                Amount = chargeAmount,
                Currency = "VND",
                Gateway = req.Gateway,
                Status = "PENDING",
                CreatedAt = DateTime.UtcNow
            };

            _db.PaymentTransactions.Add(tx);

            await _db.SaveChangesAsync();

            return Ok(new
            {
                transactionId = txId,
                amount = chargeAmount,
                originalPlanAmount = plan.Price,
                isTestAmount = useTestAmount,
                planName = plan.Name,
                gateway = req.Gateway,
                bankAccount,
                bankName,
                transferContent,
                vietQrUrl,
                expireInMinutes = 15
            });
        }

        // ══════════════════════════════════════════════════════════════════
        //  ADMIN OWNER SUBSCRIPTION
        // ══════════════════════════════════════════════════════════════════

        [HttpGet("owner/{accountId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult>
            GetOwnerSubscription(string accountId)
        {
            var subs = await _db.OwnerSubscriptions
                .Include(s => s.Plan)
                .Where(s => s.AccountId == accountId)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
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

            return Ok(subs);
        }

        [HttpPost("owner/{accountId}/assign")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignPlan(
            string accountId,
            [FromBody] InitUpgradeRequest req
        )
        {
            var account = await _db.Accounts
                .FindAsync(accountId);

            if (account == null)
            {
                return NotFound(
                    "Không tìm thấy tài khoản."
                );
            }

            var plan = await _db.SubscriptionPlans
                .FindAsync(req.PlanId);

            if (plan == null || !plan.IsActive)
            {
                return BadRequest(
                    $"Gói '{req.PlanId}' không hợp lệ."
                );
            }

            var txId = GenerateTransactionId();

            var tx = new PaymentTransaction
            {
                TransactionId = txId,
                PaymentType = "OWNER_SUBSCRIPTION",
                AccountId = accountId,
                PlanId = req.PlanId,
                Amount = 0,
                Currency = "VND",
                Gateway = "MANUAL",
                Status = "SUCCESS",
                CreatedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow
            };

            _db.PaymentTransactions.Add(tx);

            await _db.SaveChangesAsync();

            var sub =
                await _subscription
                    .ActivateSubscriptionAsync(
                        accountId,
                        req.PlanId,
                        txId
                    );

            tx.SubscriptionId = sub.SubscriptionId;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message =
                    $"Đã gán gói '{plan.Name}' cho tài khoản thành công.",

                subscriptionId =
                    sub.SubscriptionId,

                transactionId = txId,

                endDate = sub.EndDate
            });
        }

        private static string GenerateTransactionId()
        {
            var timestamp =
                DateTime.UtcNow
                    .ToString("yyyyMMddHHmmss");

            var random =
                Guid.NewGuid()
                    .ToString("N")[..6]
                    .ToUpper();

            return $"AG-{timestamp}-{random}";
        }

        private static string FirstNonEmpty(params string[] values)
        {
            foreach (var value in values)
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value.Trim();
                }
            }

            return string.Empty;
        }
    }
}