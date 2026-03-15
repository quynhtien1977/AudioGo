using Microsoft.AspNetCore.Mvc;
using Server.Services;
using Shared.DTOs;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _auth;
        public AuthController(AuthService auth) => _auth = auth;

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var result = await _auth.LoginAsync(req);
            return result is null ? Unauthorized("Sai tên đăng nhập hoặc mật khẩu.") : Ok(result);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            var account = await _auth.RegisterAsync(req);
            return account is null
                ? Conflict("Username đã tồn tại.")
                : Ok(new { account.AccountId, account.Username, account.Role });
        }
    }
}
