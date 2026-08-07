using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Services;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Security.Claims;
using System.Security.Cryptography;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _auth;
        private readonly AppDbContext _db;
        private readonly IEmailService _email;
        private readonly IConfiguration _config;
        private readonly IWebHostEnvironment _env;

        public AuthController(AuthService auth, AppDbContext db, IEmailService email, IConfiguration config, IWebHostEnvironment env)
        {
            _auth   = auth;
            _db     = db;
            _email  = email;
            _config = config;
            _env    = env;
        }

        // POST /api/auth/login
        [HttpPost("login")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            try
            {
                var result = await _auth.LoginAsync(req);

                if (result is null)
                    return Unauthorized("Sai tên đăng nhập hoặc mật khẩu.");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST /api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            var account = await _auth.RegisterAsync(req);
            return account is null
                ? Conflict("Username đã tồn tại.")
                : Ok(new { account.AccountId, account.Username, account.Role });
        }

        // ─────────────────────────────────────────────────────────────────────
        // POST /api/auth/forgot-password
        // Tìm account theo email → sinh token → gửi email reset.
        // LUÔN trả 200 OK dù email có tồn tại hay không (tránh email enumeration).
        // ─────────────────────────────────────────────────────────────────────
        [HttpPost("forgot-password")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
        {
            const string genericMessage = "Nếu địa chỉ email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.";

            if (string.IsNullOrWhiteSpace(req.Email))
                return Ok(new { message = genericMessage });

            var account = await _db.Accounts
                .FirstOrDefaultAsync(a => a.Email == req.Email && a.DeletedAt == null);

            if (account is null)
                return Ok(new { message = genericMessage }); // Không lộ email nào tồn tại

            // Sinh token crypto-safe (32 bytes = 64 hex chars)
            var tokenBytes = new byte[32];
            RandomNumberGenerator.Fill(tokenBytes);
            var token = Convert.ToHexString(tokenBytes).ToLowerInvariant();

            account.PasswordResetToken         = token;
            account.PasswordResetTokenExpireAt = DateTime.UtcNow.AddMinutes(30);
            await _db.SaveChangesAsync();

            // Tạo link reset
            var cmsBaseUrl = _config["EmailSettings:CmsBaseUrl"] ?? "http://localhost:5173";
            var resetLink  = $"{cmsBaseUrl}/reset-password?token={token}";

            await _email.SendPasswordResetEmailAsync(
                account.Email,
                account.FullName ?? account.Username,
                resetLink);

            return Ok(new { message = genericMessage });
        }

        // ─────────────────────────────────────────────────────────────────────
        // POST /api/auth/reset-password
        // Verify token → hash mật khẩu mới → xóa token.
        // ─────────────────────────────────────────────────────────────────────
        [HttpPost("reset-password")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Token) || string.IsNullOrWhiteSpace(req.NewPassword))
                return BadRequest("Token và mật khẩu mới không được để trống.");

            // Validate độ mạnh tối thiểu
            if (!IsPasswordStrong(req.NewPassword))
                return BadRequest("Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái và số.");

            var account = await _db.Accounts
                .FirstOrDefaultAsync(a => a.PasswordResetToken == req.Token && a.DeletedAt == null);

            if (account is null)
                return BadRequest("Token không hợp lệ.");

            if (account.PasswordResetTokenExpireAt < DateTime.UtcNow)
                return BadRequest("Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.");

            // Cập nhật mật khẩu và xóa token
            account.PasswordHash              = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
            account.PasswordResetToken        = null;
            account.PasswordResetTokenExpireAt = null;
            account.MustChangePassword        = false;
            account.UpdatedAt                 = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới." });
        }

        // ─────────────────────────────────────────────────────────────────────
        // POST /api/auth/change-password  [Authorize]
        // Người dùng tự đổi mật khẩu (verify mật khẩu cũ trước).
        // ─────────────────────────────────────────────────────────────────────
        [HttpPost("change-password")]
        [EnableRateLimiting("auth")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.OldPassword) || string.IsNullOrWhiteSpace(req.NewPassword))
                return BadRequest("Mật khẩu cũ và mật khẩu mới không được để trống.");

            if (!IsPasswordStrong(req.NewPassword))
                return BadRequest("Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ cái và số.");

            var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (accountId is null) return Unauthorized();

            var account = await _db.Accounts
                .FirstOrDefaultAsync(a => a.AccountId == accountId && a.DeletedAt == null);

            if (account is null) return NotFound("Không tìm thấy tài khoản.");

            // Xác minh mật khẩu cũ
            if (!BCrypt.Net.BCrypt.Verify(req.OldPassword, account.PasswordHash))
                return BadRequest("Mật khẩu cũ không đúng.");

            // Cập nhật mật khẩu mới
            account.PasswordHash       = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
            account.MustChangePassword = false;
            account.UpdatedAt          = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Đổi mật khẩu thành công." });
        }

        /// <summary>
        /// [DEV ONLY] Tạo hoặc reset admin account.
        /// Gọi 1 lần: POST /api/auth/setup-dev
        /// Body: { "identifier": "admin", "password": "Admin@123" }
        /// </summary>
        [HttpPost("setup-dev")]
        public async Task<IActionResult> SetupDev([FromBody] LoginRequest req)
        {
            // ⛔ Chỉ hoạt động trong môi trường Development — ẩn hoàn toàn ở Production
            if (!_env.IsDevelopment())
                return NotFound();

            var existing = await _db.Accounts.FirstOrDefaultAsync(a => a.Username == req.Identifier);
            if (existing is not null)
                _db.Accounts.Remove(existing);

            var account = new Server.Models.Account
            {
                AccountId    = Guid.NewGuid().ToString(),
                Username     = req.Identifier,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                Role         = "Admin",
                CreatedAt    = DateTime.UtcNow
            };
            _db.Accounts.Add(account);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message  = $"Account '{req.Identifier}' đã được tạo/reset với role Admin.",
                username = req.Identifier,
                role     = "Admin"
            });
        }

        // ── Helpers ───────────────────────────────────────────────────────────
        private static bool IsPasswordStrong(string password)
        {
            if (password.Length < 8) return false;
            bool hasLetter = password.Any(char.IsLetter);
            bool hasDigit  = password.Any(char.IsDigit);
            return hasLetter && hasDigit;
        }
    }
}
