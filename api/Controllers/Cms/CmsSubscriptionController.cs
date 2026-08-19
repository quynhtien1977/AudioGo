using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services;
using System.Diagnostics;
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
        private readonly AppDbContext _db;
        private readonly SubscriptionService _subscription;
        private readonly IConfiguration _config;
        private readonly ILogger<CmsSubscriptionController> _logger;

        public CmsSubscriptionController(
            AppDbContext db,
            SubscriptionService subscription,
            IConfiguration config,
            ILogger<CmsSubscriptionController> logger
        )
        {
            _db = db;
            _subscription = subscription;
            _config = config;
            _logger = logger;
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

        /// <summary>
        /// GET /api/cms/subscriptions/expiring?days=7
        /// Admin: đếm subscriptions s\u1eafp h\u1ebft h\u1ea1n trong N ng\u00e0y
        /// </summary>
        [HttpGet("expiring")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetExpiring([FromQuery] int days = 7)
        {
            var cutoff = DateTime.UtcNow.AddDays(days);
            var count = await _db.OwnerSubscriptions
                .CountAsync(s => s.Status == "ACTIVE" && s.EndDate <= cutoff && s.EndDate > DateTime.UtcNow);
            return Ok(new { count, days });
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

            // MoMo chưa được implement — chỉ dùng SePay
            if (req.Gateway != "SEPAY")
            {
                return BadRequest(
                    "Hiện tại chỉ hỗ trợ gateway 'SEPAY'."
                );
            }

            // Idempotency: Tái sử dụng PENDING tx trong 15 phút để tránh rác DB
            var sw = Stopwatch.StartNew();
            var existingTx = await _db.PaymentTransactions
                .Where(t => t.AccountId == accountId
                         && t.PlanId == req.PlanId
                         && t.Status == "PENDING"
                         && t.PaymentType == "OWNER_SUBSCRIPTION"
                         && t.CreatedAt >= DateTime.UtcNow.AddMinutes(-15))
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (existingTx != null)
            {
                sw.Stop();
                _logger.LogInformation(
                    "Owner upgrade init reused pending tx. Account={AccountId} Tx={TxId} Plan={PlanId} ElapsedMs={ElapsedMs}",
                    accountId, existingTx.TransactionId, req.PlanId, sw.ElapsedMilliseconds);
                return Ok(BuildOwnerInitResponse(existingTx, plan));
            }

            var txId = GenerateTransactionId();
            var useTestAmount = _config.GetValue<bool>("SubscriptionPayment:UseTestAmount");
            var testAmountVnd = _config.GetValue<decimal>("SubscriptionPayment:TestAmountVnd", 2000);
            var chargeAmount = useTestAmount
                ? (testAmountVnd > 0 ? testAmountVnd : 2000)
                : plan.Price;

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
            sw.Stop();

            _logger.LogInformation(
                "Owner upgrade init created new tx. Account={AccountId} Tx={TxId} Plan={PlanId} Amount={Amount} ElapsedMs={ElapsedMs}",
                accountId, txId, req.PlanId, chargeAmount, sw.ElapsedMilliseconds);

            return Ok(BuildOwnerInitResponse(tx, plan));
        }

        // ══════════════════════════════════════════════════════════════════
        //  VERIFY TRẠNG THÁI THANH TOÁN (Owner poll sau khi hiển thị QR)
        // ══════════════════════════════════════════════════════════════════

        /// <summary>
        /// GET /api/cms/subscriptions/upgrade/verify?transactionId=AG-...
        /// Owner poll mỗi 5s để biết SePay đã xác nhận chưa.
        /// Trả về status: PENDING | SUCCESS | FAILED | EXPIRED
        /// Khi SUCCESS: trả thêm planName, endDate, daysRemaining.
        /// </summary>
        [HttpGet("upgrade/verify")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> VerifyUpgrade([FromQuery] string transactionId)
        {
            if (string.IsNullOrWhiteSpace(transactionId))
                return BadRequest("transactionId là bắt buộc.");

            var accountId = CurrentUserId();

            var tx = await _db.PaymentTransactions
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.TransactionId == transactionId
                                       && t.PaymentType   == "OWNER_SUBSCRIPTION"
                                       && t.AccountId     == accountId);

            if (tx == null)
                return NotFound("Không tìm thấy giao dịch.");

            // Fallback: nếu giao dịch đang PENDING, kiểm tra account này
            // có subscription SUCCESS nào trong 30 phút qua không
            // (trường hợp web reload tạo tx mới nhưng payment đã về tx cũ)
            if (tx.Status == "PENDING")
            {
                var recentSuccess = await _db.PaymentTransactions
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.AccountId     == accountId
                                           && t.PaymentType   == "OWNER_SUBSCRIPTION"
                                           && t.Status        == "SUCCESS"
                                           && t.CompletedAt   >= DateTime.UtcNow.AddMinutes(-30));
                if (recentSuccess != null)
                    tx = recentSuccess;
            }

            if (tx.Status != "SUCCESS")
            {
                return Ok(new
                {
                    status  = tx.Status,
                    message = tx.Status switch
                    {
                        "PENDING"  => "Đang chờ xác nhận thanh toán...",
                        "FAILED"   => "Giao dịch thất bại. Vui lòng thử lại.",
                        "EXPIRED"  => "Giao dịch đã hết hạn. Vui lòng tạo QR mới.",
                        _          => $"Trạng thái: {tx.Status}"
                    }
                });
            }

            // SUCCESS — lấy thông tin subscription đã activate
            var sub = await _db.OwnerSubscriptions
                .Include(s => s.Plan)
                .Where(s => s.AccountId == accountId && s.Status == "ACTIVE")
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            _logger.LogInformation(
                "Owner upgrade verified SUCCESS. Account={AccountId} Tx={TxId}",
                accountId, tx.TransactionId);

            return Ok(new
            {
                status       = "SUCCESS",
                message      = "Thanh toán thành công! Gói đã được kích hoạt.",
                planName     = sub?.Plan?.Name ?? tx.PlanId,
                endDate      = sub?.EndDate,
                daysRemaining = sub == null
                    ? (int?)null
                    : (int)(sub.EndDate - DateTime.UtcNow).TotalDays
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

        private object BuildOwnerInitResponse(PaymentTransaction tx, SubscriptionPlan plan)
        {
            var useTestAmount   = _config.GetValue<bool>("SubscriptionPayment:UseTestAmount");
            var bankAccount     = FirstNonEmpty(
                _config["SubscriptionPayment:BankAccountNo"],
                _config["TouristAccess:BankAccountNo"],
                "24200502218");
            var bankName        = FirstNonEmpty(_config["SubscriptionPayment:BankName"], "TP Bank");
            var transferContent = $"Nang goi AudioGo {tx.TransactionId}";
            var encodedContent  = Uri.EscapeDataString(transferContent);
            var vietQrUrl       = $"https://img.vietqr.io/image/TPB-{bankAccount}-compact2.png"
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
                bankAccount,
                bankName,
                transferContent,
                vietQrUrl,
                expireInMinutes    = 15
            };
        }

        private static string GenerateTransactionId()
        {
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            var random    = Guid.NewGuid().ToString("N")[..6].ToUpper();
            return $"AG-{timestamp}-{random}";
        }

        private static string FirstNonEmpty(params string[] values)
        {
            foreach (var value in values)
            {
                if (!string.IsNullOrWhiteSpace(value))
                    return value.Trim();
            }
            return string.Empty;
        }
    }
}