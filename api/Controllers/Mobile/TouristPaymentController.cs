using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Diagnostics;
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
        private readonly IAppSettingService _settings;
        private readonly ILogger<TouristPaymentController> _logger;

        // PriceVnd và DurationDays đọc từ DB (có cache 60s), fallback về appsettings
        private async Task<decimal> GetPriceVndAsync()
            => await _settings.GetAsync("TouristAccess.PriceVnd",
                   _config.GetValue<decimal>("TouristAccess:PriceVnd", 10000));

        private async Task<int> GetDurationDaysAsync()
            => await _settings.GetAsync("TouristAccess.DurationDays",
                   _config.GetValue<int>("TouristAccess:DurationDays", 7));

        private string BankAccount => _config["TouristAccess:BankAccountNo"] ?? "24200502218";

        public TouristPaymentController(
            AppDbContext db,
            IConfiguration config,
            IAppSettingService settings,
            ILogger<TouristPaymentController> logger)
        {
            _db       = db;
            _config   = config;
            _settings = settings;
            _logger   = logger;
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
            var sw = Stopwatch.StartNew();
            var maskedDeviceId = MaskDeviceId(req.DeviceId);
            _logger.LogInformation(
                "Tourist payment init requested. Device={DeviceId}",
                maskedDeviceId);

            if (string.IsNullOrEmpty(req.DeviceId))
            {
                _logger.LogWarning("Tourist payment init rejected: missing DeviceId");
                return BadRequest("DeviceId là bắt buộc.");
            }

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

            var durationDays = await GetDurationDaysAsync();

            if (existing != null)
            {
                sw.Stop();
                _logger.LogInformation(
                    "Tourist payment init reused pending transaction. Device={DeviceId} Tx={TransactionId} ElapsedMs={ElapsedMs}",
                    maskedDeviceId, existing.TransactionId, sw.ElapsedMilliseconds);
                return Ok(BuildInitResponse(existing, durationDays));
            }

            var txId = GenerateTransactionId();
            var priceVnd = await GetPriceVndAsync();
            var tx = new PaymentTransaction
            {
                TransactionId = txId,
                PaymentType   = "TOURIST_ACCESS",
                AccountId     = null,
                PlanId        = null,
                Amount        = priceVnd,
                Currency      = "VND",
                Gateway       = "SEPAY",
                Status        = "PENDING",
                ContactInfo   = contactInfo,
                CreatedAt     = DateTime.UtcNow
            };

            _db.PaymentTransactions.Add(tx);
            await _db.SaveChangesAsync();
            sw.Stop();

            _logger.LogInformation(
                "Tourist payment init created transaction. Device={DeviceId} Tx={TransactionId} ElapsedMs={ElapsedMs}",
                maskedDeviceId, tx.TransactionId, sw.ElapsedMilliseconds);

            return Ok(BuildInitResponse(tx, durationDays));
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
                    token    = GenerateGuestToken(deviceId, await GetDurationDaysAsync()),
                    expireAt = DateTime.UtcNow.AddDays(await GetDurationDaysAsync())
                }),
                "PENDING" => Ok(new  { status = "PENDING", message = "Đang chờ xác nhận..." }),
                "FAILED"  => Ok(new  { status = "FAILED",  message = "Giao dịch thất bại. Vui lòng thử lại." }),
                _         => Ok(new  { status = tx.Status })
            };
        }

        // ══════════════════════════════════════════════════════════════════════
        //  HELPERS
        // ══════════════════════════════════════════════════════════════════════

        private object BuildInitResponse(PaymentTransaction tx, int durationDays)
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
                durationDays    = durationDays,
                gateway         = tx.Gateway,
                bankAccount     = BankAccount,
                bankName        = "TP Bank",
                transferContent,
                vietQrUrl,                          // App hiển thị ảnh QR từ URL này
                expireInMinutes = 15
            };
        }

        private string GenerateGuestToken(string deviceId, int durationDays)
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
                expires:            DateTime.UtcNow.AddDays(durationDays),
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

        private static string MaskDeviceId(string? deviceId)
        {
            if (string.IsNullOrWhiteSpace(deviceId)) return "(empty)";
            if (deviceId.Length <= 6) return "***";
            return $"{deviceId[..3]}***{deviceId[^3..]}";
        }
    }
}
