using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Server.Data;
using Server.Models;
using Shared.DTOs;

namespace Server.Services
{
    public class AuthService
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;

        public AuthService(AppDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest req)
        {
            // Tìm account bằng username, email hoặc số điện thoại
            var account = await _db.Accounts
                .FirstOrDefaultAsync(a => a.Username == req.Identifier || 
                                          a.Email == req.Identifier || 
                                          a.PhoneNumber == req.Identifier);

            if (account is null || !BCrypt.Net.BCrypt.Verify(req.Password, account.PasswordHash))
                return null;

            if (account.IsLocked == true)
            {
                throw new Exception("Tài khoản của bạn đã bị khóa");
            }

            return new LoginResponse(GenerateToken(account), account.Role, account.AccountId, account.FullName,
                DateTime.UtcNow.AddMinutes(GetExpiryMinutes()));
        }

        public async Task<Account?> RegisterAsync(RegisterRequest req)
        {
            if (await _db.Accounts.AnyAsync(a => a.Username == req.Username))
                return null;

            var account = new Account
            {
                AccountId    = Guid.NewGuid().ToString(),
                Username     = req.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                Role         = "Manager",
                CreatedAt    = DateTime.UtcNow
            };
            _db.Accounts.Add(account);
            await _db.SaveChangesAsync();
            return account;
        }

        private string GenerateToken(Account account)
        {
            var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims  = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, account.AccountId),
                new Claim(ClaimTypes.Name,            account.Username),
                new Claim(ClaimTypes.Role,            account.Role ?? "Manager")
            };
            var token = new JwtSecurityToken(
                issuer:   _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims:   claims,
                expires:  DateTime.UtcNow.AddMinutes(GetExpiryMinutes()),
                signingCredentials: creds);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private double GetExpiryMinutes() =>
            double.TryParse(_config["Jwt:ExpiryMinutes"], out var m) ? m : 1440;
    }
}
