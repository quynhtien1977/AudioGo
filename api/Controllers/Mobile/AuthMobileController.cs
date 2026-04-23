using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Server.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Server.Controllers.Mobile
{
    [ApiController]
    [Route("api/mobile/auth")]
    public class AuthMobileController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;

        public AuthMobileController(AppDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        public record ScanQrRequest(string Code, string DeviceId);

        [HttpPost("scan-qr")]
        public async Task<IActionResult> ScanQr([FromBody] ScanQrRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Code) || string.IsNullOrWhiteSpace(req.DeviceId))
                return BadRequest("Code và DeviceId không được để trống.");

            var codeEntry = await _db.AppAccessCodes.FirstOrDefaultAsync(c => c.Code == req.Code);

            if (codeEntry == null)
                return NotFound("Mã QR không tồn tại.");

            // Nếu mã đã được sử dụng
            if (!string.IsNullOrEmpty(codeEntry.UsedByDeviceId))
            {
                // Kiểm tra xem có đúng máy cũ không
                if (codeEntry.UsedByDeviceId != req.DeviceId)
                {
                    return Forbid("Mã này đã được sử dụng bởi một thiết bị khác.");
                }

                // Nếu đúng máy cũ, kiểm tra xem còn hạn không
                if (codeEntry.ExpireAt < DateTime.UtcNow)
                {
                    return Forbid("Mã phiên truy cập đã hết hạn.");
                }
            }
            else
            {
                // Mã này mới toanh, kích hoạt luôn
                codeEntry.UsedByDeviceId = req.DeviceId;
                codeEntry.ActivatedAt = DateTime.UtcNow;
                codeEntry.ExpireAt = DateTime.UtcNow.AddDays(7);
                await _db.SaveChangesAsync();
            }

            // Sinh JWT Token cấp quyền cho user xài 7 ngày
            var token = GenerateGuestToken(req.DeviceId, codeEntry.ExpireAt.Value);

            return Ok(new
            {
                message = "Xác thực mã QR thành công.",
                token = token,
                expireAt = codeEntry.ExpireAt
            });
        }

        private string GenerateGuestToken(string deviceId, DateTime expireAt)
        {
            var keyStr = _config["Jwt:Key"] ?? "SUPER_SECRET_KEY_REQUIRED_AT_LEAST_32_CHARS";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, deviceId),
                new Claim(ClaimTypes.Role, "GuestApp") // Role riêng cho khách quét QR
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: expireAt, // Token lấy đúng hạn của QR
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
