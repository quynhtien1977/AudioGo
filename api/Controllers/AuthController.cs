using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Services;
using Shared.DTOs;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _auth;
        private readonly AppDbContext _db;

        public AuthController(AuthService auth, AppDbContext db)
        {
            _auth = auth;
            _db   = db;
        }

        // POST /api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var result = await _auth.LoginAsync(req);
            return result is null ? Unauthorized("Sai tên đăng nhập hoặc mật khẩu.") : Ok(result);
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

        /// <summary>
        /// [DEV ONLY] Tạo hoặc reset admin account.
        /// Gọi 1 lần: POST /api/auth/setup-dev
        /// Body: { "username": "admin", "password": "Admin@123" }
        /// </summary>
        [HttpPost("setup-dev")]
        public async Task<IActionResult> SetupDev([FromBody] LoginRequest req)
        {
            // Xóa account cũ nếu có
            var existing = await _db.Accounts.FirstOrDefaultAsync(a => a.Username == req.Username);
            if (existing is not null)
                _db.Accounts.Remove(existing);

            // Tạo mới với BCrypt hash đúng
            var account = new Server.Models.Account
            {
                AccountId    = Guid.NewGuid().ToString(),
                Username     = req.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                Role         = "Admin",
                CreatedAt    = DateTime.UtcNow
            };
            _db.Accounts.Add(account);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message  = $"Account '{req.Username}' đã được tạo/reset với role Admin.",
                username = req.Username,
                role     = "Admin"
            });
        }
    }
}
