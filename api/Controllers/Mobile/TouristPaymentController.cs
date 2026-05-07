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
    /// Luồng: Du khách thanh toán online (SePay) để vào app — thay thế quét QR vật lý.
    ///
    ///   1. POST /api/mobile/payment/init   — Tạo giao dịch PENDING, trả về TxId + nội dung CK + VietQR URL
    ///   2. [SePay gọi webhook] → PaymentWebhookService.HandleSePayAsync() → mark SUCCESS
    ///   3. GET  /api/mobile/payment/verify — App poll mỗi 5s → khi SUCCESS trả JWT
    ///
    /// Giá vào app (TouristAccess:PriceVnd) có thể admin đổi trong appsettings mà không cần redeploy.
    /// </summary>
    [ApiController]
    [Route("api/mobile/payment")]
    public class TouristPaymentController : ControllerBase
    {
        private readonly AppDbContext   _db;
        private readonly IConfiguration _config;

        // ── Đọc từ appsettings — admin có thể thay đổi giá ──────────────────
        private decimal PriceVnd     => _config.GetValue<decimal>("TouristAccess:PriceVnd",   10000);
        private int     DurationDays => _config.GetValue<int>    ("TouristAccess:DurationDays", 365);
        private string  BankAccount  => _config["TouristAccess:BankAccountNo"] ?? "24200502218";

        public TouristPaymentController(AppDbContext db, IConfiguration config)
        {
            _db     = db;
            _config = config;
        }

        // ══════════════════════════════════════════════════════════════════════
        //  1. KHỞI TẠO GIAO DỊCH
        // ══════════════════════════════════════════════════════════════════════

        public record InitTouristPaymentRequest(
            string DeviceId     // Định danh thiết bị
        );

        /// <summary>
        /// POST /api/mobile/payment/init
        /// Tạo PaymentTransaction PENDING.
        /// Trả về TxId, số tiền, nội dung CK, và URL ảnh VietQR (TPBank).
        /// </summary>
        [HttpPost("init")]
        public async Task<IActionResult> Init([FromBody] InitTouristPaymentRequest req)
        {
            if (string.IsNullOrEmpty(req.DeviceId))
                return BadRequest("DeviceId là bắt buộc.");

            // Với khách du lịch, dùng DeviceId làm ContactInfo để lưu vào DB
            var contactInfo = req.DeviceId;

            // Idempotency: Kiểm tra xem thiết bị này có giao dịch PENDING nào trong 15 phút qua không
            // để tránh rác DB khi user spam nút "Thử lại".
            var existing = await _db.PaymentTransactions
                .Where(p => p.ContactInfo == contactInfo 
                         && p.Status == "PENDING"
                         && p.PaymentType == "TOURIST_ACCESS"
                         && p.CreatedAt >= DateTime.UtcNow.AddMinutes(-15))
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (existing != null)
                return Ok(BuildInitResponse(existing));

            var txId = GenerateTransactionId();
            var tx = new PaymentTransaction
            {
                TransactionId = txId,
                PaymentType   = "TOURIST_ACCESS",
                AccountId     = null,
                PlanId        = null,                // Không dùng plan — giá cố định từ config
                Amount        = PriceVnd,
                Currency      = "VND",
                Gateway       = "SEPAY",
                Status        = "PENDING",
                ContactInfo   = contactInfo,
                CreatedAt     = DateTime.UtcNow
            };

            _db.PaymentTransactions.Add(tx);
            await _db.SaveChangesAsync();

            return Ok(BuildInitResponse(tx));
        }

        // ══════════════════════════════════════════════════════════════════════
        //  2. VERIFY & LẤY JWT
        // ══════════════════════════════════════════════════════════════════════

        /// <summary>
        /// GET /api/mobile/payment/verify?transactionId=AG-...&amp;deviceId=...
        /// App poll sau khi hiển thị QR. Khi SePay xác nhận → trả JWT GuestApp.
        /// </summary>
        [HttpGet("verify")]
        public async Task<IActionResult> Verify(
            [FromQuery] string transactionId,
            [FromQuery] string deviceId)
        {
            if (string.IsNullOrEmpty(transactionId) || string.IsNullOrEmpty(deviceId))
                return BadRequest("transactionId và deviceId là bắt buộc.");

            var tx = await _db.PaymentTransactions
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.TransactionId == transactionId
                                       && t.PaymentType   == "TOURIST_ACCESS");

            if (tx == null)
                return NotFound("Không tìm thấy giao dịch.");

            // Tự động fallback: nếu giao dịch này đang PENDING, thử kiểm tra xem thiết bị
            // này đã có giao dịch SUCCESS nào trong vòng 30 phút qua chưa (trường hợp app 
            // bị reload tạo mã mới nhưng user đã lỡ chuyển tiền vào mã cũ).
            if (tx.Status == "PENDING")
            {
                var recentSuccess = await _db.PaymentTransactions
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.ContactInfo == deviceId
                                           && t.PaymentType == "TOURIST_ACCESS"
                                           && t.Status      == "SUCCESS"
                                           && t.CompletedAt >= DateTime.UtcNow.AddMinutes(-30));
                
                if (recentSuccess != null)
                {
                    tx = recentSuccess;
                }
            }

            return tx.Status switch
            {
                "SUCCESS" => Ok(new
                {
                    status   = "SUCCESS",
                    message  = "Thanh toán thành công. Chào mừng đến với AudioGo!",
                    token    = GenerateGuestToken(deviceId),
                    expireAt = DateTime.UtcNow.AddDays(DurationDays)
                }),
                "PENDING" => Ok(new  { status = "PENDING", message = "Đang chờ xác nhận..." }),
                "FAILED"  => Ok(new  { status = "FAILED",  message = "Giao dịch thất bại. Vui lòng thử lại." }),
                _         => Ok(new  { status = tx.Status })
            };
        }

        // ══════════════════════════════════════════════════════════════════════
        //  HELPERS
        // ══════════════════════════════════════════════════════════════════════

        private object BuildInitResponse(PaymentTransaction tx)
        {
            var transferContent = $"AudioGo {tx.TransactionId}";
            var encodedContent  = Uri.EscapeDataString(transferContent);
            var vietQrUrl       = $"https://img.vietqr.io/image/TPB-{BankAccount}-compact2.png" +
                                  $"?amount={tx.Amount:F0}" +
                                  $"&addInfo={encodedContent}" +
                                  $"&accountName=AUDIOGO";

            return new
            {
                transactionId   = tx.TransactionId,
                amount          = tx.Amount,
                durationDays    = DurationDays,
                gateway         = tx.Gateway,
                bankAccount     = BankAccount,
                bankName        = "TP Bank",
                transferContent,
                vietQrUrl,                          // App hiển thị ảnh QR từ URL này
                expireInMinutes = 15
            };
        }

        private string GenerateGuestToken(string deviceId)
        {
            var keyStr = _config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key chưa cấu hình");
            var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
            var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, deviceId),
                new Claim(ClaimTypes.Role, "GuestApp")
            };

            var token = new JwtSecurityToken(
                issuer:             _config["Jwt:Issuer"],
                audience:           _config["Jwt:Audience"],
                claims:             claims,
                expires:            DateTime.UtcNow.AddDays(DurationDays),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string GenerateTransactionId()
        {
            var ts     = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            var random = Guid.NewGuid().ToString("N")[..6].ToUpper();
            return $"AG{ts}{random}";
        }
    }
}
