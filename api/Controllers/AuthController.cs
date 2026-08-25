using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Security.Claims;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _auth;
        private readonly IAuthManagementService _authMgmt;
        private readonly AppDbContext _db;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            AuthService auth,
            IAuthManagementService authMgmt,
            AppDbContext db,
            IWebHostEnvironment env,
            ILogger<AuthController> logger)
        {
            _auth     = auth;
            _authMgmt = authMgmt;
            _db       = db;
            _env      = env;
            _logger   = logger;
        }

        // POST /api/auth/login
        [HttpPost("login")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            try
            {
                var result = await _auth.LoginAsync(req);
                return result is null
                    ? Unauthorized("Sai tên đăng nhập hoặc mật khẩu.")
                    : Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login thất bại");
                return BadRequest("Đăng nhập thất bại. Vui lòng thử lại.");
            }
        }

        // POST /api/auth/register
        [HttpPost("register")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            var account = await _auth.RegisterAsync(req);
            return account is null
                ? Conflict("Username đã tồn tại.")
                : Ok(new { account.AccountId, account.Username, account.Role });
        }

        // POST /api/auth/forgot-password
        // LUÔN trả 200 OK dù email có tồn tại hay không (tránh email enumeration).
        [HttpPost("forgot-password")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
        {
            const string genericMessage = "Nếu địa chỉ email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.";

            await _authMgmt.SendPasswordResetEmailAsync(req.Email ?? string.Empty);
            return Ok(new { message = genericMessage });
        }

        // POST /api/auth/reset-password
        [HttpPost("reset-password")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
        {
            var (success, error) = await _authMgmt.ResetPasswordAsync(req.Token, req.NewPassword);
            if (!success) return BadRequest(error);
            return Ok(new { message = "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới." });
        }

        // GET /api/auth/me  [Authorize]
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (accountId is null) return Unauthorized();

            var dto = await _authMgmt.GetAccountProfileAsync(accountId);
            return dto is null ? NotFound() : Ok(dto);
        }

        // POST /api/auth/change-password  [Authorize]
        [HttpPost("change-password")]
        [EnableRateLimiting("auth")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
        {
            var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (accountId is null) return Unauthorized();

            var (success, error) = await _authMgmt.ChangePasswordAsync(accountId, req.OldPassword, req.NewPassword);
            if (!success) return BadRequest(error);
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

            var account = new Account
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
    }
}
