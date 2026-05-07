using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Server.Data;
using Server.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Server.Controllers.Mobile
{
    /// <summary>
    /// Luồng A: Du khách thanh toán online để vào app.
    ///
    ///   1. POST /api/mobile/payment/init   — Khởi tạo giao dịch PENDING, trả về thông tin QR
    ///   2. [Webhook SePay/MoMo gọi về backend] → PaymentWebhookService.HandleSePayAsync/HandleMoMoAsync
    ///   3. GET  /api/mobile/payment/verify  — App poll hoặc gọi sau redirect để lấy JWT
    /// </summary>
    [ApiController]
    [Route("api/mobile/payment")]
    public class TouristPaymentController : ControllerBase
    {
        private readonly AppDbContext  _db;
        private readonly IConfiguration _config;

        public TouristPaymentController(AppDbContext db, IConfiguration config)
        {
            _db     = db;
            _config = config;
        }

        // ══════════════════════════════════════════════════════════════════
        //  1. KHỞI TẠO GIAO DỊCH
        // ══════════════════════════════════════════════════════════════════

        public record InitTouristPaymentRequest(
            string PlanId,      // Gói du khách muốn mua (thường là 'basic' = 1 ngày xài app)
            string Gateway,     // 'SEPAY' | 'MOMO'
            string ContactInfo, // SĐT hoặc email du khách (để verify sau)
            string DeviceId     // Định danh thiết bị
        );

        /// <summary>
        /// POST /api/mobile/payment/init
        /// App gọi khi du khách chọn thanh toán online.
        /// Trả về TransactionId + thông tin để app hiển thị QR.
        /// </summary>
        [HttpPost("init")]
        public async Task<IActionResult> Init([FromBody] InitTouristPaymentRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.ContactInfo))
                return BadRequest("ContactInfo (SĐT hoặc email) là bắt buộc để xác minh sau thanh toán.");

            if (string.IsNullOrWhiteSpace(req.DeviceId))
                return BadRequest("DeviceId là bắt buộc.");

            if (req.Gateway != "SEPAY" && req.Gateway != "MOMO")
                return BadRequest("Gateway phải là 'SEPAY' hoặc 'MOMO'.");

            var plan = await _db.SubscriptionPlans
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.PlanId == req.PlanId && p.IsActive);

            if (plan == null)
                return BadRequest($"Gói '{req.PlanId}' không hợp lệ.");

            // Kiểm tra thiết bị này đã có giao dịch PENDING chưa (tránh tạo trùng)
            var existingPending = await _db.PaymentTransactions
                .Where(t => t.ContactInfo == req.ContactInfo
                         && t.Status == "PENDING"
                         && t.PaymentType == "TOURIST_ACCESS")
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (existingPending != null && existingPending.CreatedAt > DateTime.UtcNow.AddMinutes(-15))
            {
                // Trả lại giao dịch cũ còn trong hạn 15 phút
                return Ok(BuildInitResponse(existingPending, plan));
            }

            var txId = GenerateTransactionId();
            var tx = new PaymentTransaction
            {
                TransactionId = txId,
                PaymentType   = "TOURIST_ACCESS",
                AccountId     = null,
                PlanId        = req.PlanId,
                Amount        = plan.Price,
                Currency      = "VND",
                Gateway       = req.Gateway,
                Status        = "PENDING",
                ContactInfo   = req.ContactInfo,
                CreatedAt     = DateTime.UtcNow
            };

            _db.PaymentTransactions.Add(tx);
            await _db.SaveChangesAsync();

            return Ok(BuildInitResponse(tx, plan));
        }

        // ══════════════════════════════════════════════════════════════════
        //  2. VERIFY & LẤY JWT
        // ══════════════════════════════════════════════════════════════════

        /// <summary>
        /// GET /api/mobile/payment/verify?transactionId=AG-...&deviceId=...
        /// App poll sau khi thanh toán (hoặc gọi khi MoMo redirect về app).
        /// Nếu SUCCESS → trả về JWT để vào app.
        /// </summary>
        [HttpGet("verify")]
        public async Task<IActionResult> Verify(
            [FromQuery] string transactionId,
            [FromQuery] string deviceId)
        {
            if (string.IsNullOrEmpty(transactionId) || string.IsNullOrEmpty(deviceId))
                return BadRequest("transactionId và deviceId là bắt buộc.");

            var tx = await _db.PaymentTransactions
                .Include(t => t.Plan)
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.TransactionId == transactionId
                                       && t.PaymentType   == "TOURIST_ACCESS");

            if (tx == null)
                return NotFound("Không tìm thấy giao dịch.");

            return tx.Status switch
            {
                "SUCCESS" => Ok(new
                {
                    status  = "SUCCESS",
                    message = "Thanh toán thành công. Chào mừng đến với AudioGo!",
                    token   = GenerateGuestToken(deviceId, tx.Plan!.DurationDay),
                    expireAt = DateTime.UtcNow.AddDays(tx.Plan!.DurationDay),
                    plan    = new { tx.Plan.PlanId, tx.Plan.Name, tx.Plan.DurationDay }
                }),
                "PENDING" => Ok(new { status = "PENDING", message = "Đang chờ xác nhận thanh toán..." }),
                "FAILED"  => BadRequest(new { status = "FAILED",  message = "Giao dịch thất bại. Vui lòng thử lại." }),
                _         => BadRequest(new { status = tx.Status })
            };
        }

        // ══════════════════════════════════════════════════════════════════
        //  HELPER
        // ══════════════════════════════════════════════════════════════════

        private static object BuildInitResponse(PaymentTransaction tx, SubscriptionPlan plan) => new
        {
            transactionId   = tx.TransactionId,
            amount          = tx.Amount,
            planName        = plan.Name,
            durationDay     = plan.DurationDay,
            gateway         = tx.Gateway,
            // SePay: embed TransactionId vào nội dung chuyển khoản
            transferContent = $"AudioGo {tx.TransactionId}",
            // MoMo: orderId = TransactionId khi tạo payment request phía app
            orderId         = tx.TransactionId,
            expireInMinutes = 15
        };

        private string GenerateGuestToken(string deviceId, int durationDay)
        {
            var keyStr  = _config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key chưa cấu hình");
            var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
            var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiry  = DateTime.UtcNow.AddDays(durationDay);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, deviceId),
                new Claim(ClaimTypes.Role, "GuestApp")
            };

            var token = new JwtSecurityToken(
                issuer:             _config["Jwt:Issuer"],
                audience:           _config["Jwt:Audience"],
                claims:             claims,
                expires:            expiry,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string GenerateTransactionId()
        {
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            var random    = Guid.NewGuid().ToString("N")[..6].ToUpper();
            return $"AG-{timestamp}-{random}";
        }
    }
}
