using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Security.Cryptography;

namespace Server.Services
{
    /// <summary>
    /// Triển khai các nghiệp vụ auth phức tạp đã được tách ra khỏi AuthController.
    /// </summary>
    public class AuthManagementService : IAuthManagementService
    {
        private readonly AppDbContext _db;
        private readonly IEmailService _email;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthManagementService> _logger;

        public AuthManagementService(
            AppDbContext db,
            IEmailService email,
            IConfiguration config,
            ILogger<AuthManagementService> logger)
        {
            _db     = db;
            _email  = email;
            _config = config;
            _logger = logger;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Forgot password — tìm account → sinh token → gửi email reset
        // Luôn trả true/false nội bộ; controller luôn trả 200 OK để tránh email enumeration.
        // ─────────────────────────────────────────────────────────────────────
        public async Task<bool> SendPasswordResetEmailAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            var account = await _db.Accounts
                .FirstOrDefaultAsync(a => a.Email == email && a.DeletedAt == null);

            if (account is null)
                return false; // Không lộ email ra ngoài

            // Sinh token crypto-safe (32 bytes = 64 hex chars)
            var tokenBytes = new byte[32];
            RandomNumberGenerator.Fill(tokenBytes);
            var token = Convert.ToHexString(tokenBytes).ToLowerInvariant();

            account.PasswordResetToken         = token;
            account.PasswordResetTokenExpireAt = DateTime.UtcNow.AddMinutes(30);
            await _db.SaveChangesAsync();

            // Tạo link reset và gửi email
            var cmsBaseUrl = _config["EmailSettings:CmsBaseUrl"] ?? "http://localhost:5173";
            var resetLink  = $"{cmsBaseUrl}/reset-password?token={token}";

            await _email.SendPasswordResetEmailAsync(
                account.Email,
                account.FullName ?? account.Username,
                resetLink);

            _logger.LogInformation("Password reset email sent for account {AccountId}", account.AccountId);
            return true;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Reset password — xác minh token → hash mật khẩu mới → xóa token
        // ─────────────────────────────────────────────────────────────────────
        public async Task<(bool Success, string? Error)> ResetPasswordAsync(string token, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(newPassword))
                return (false, "Token và mật khẩu mới không được để trống.");

            if (!IsPasswordStrong(newPassword))
                return (false, "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái và số.");

            var account = await _db.Accounts
                .FirstOrDefaultAsync(a => a.PasswordResetToken == token && a.DeletedAt == null);

            if (account is null)
                return (false, "Token không hợp lệ.");

            if (account.PasswordResetTokenExpireAt < DateTime.UtcNow)
                return (false, "Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.");

            account.PasswordHash               = BCrypt.Net.BCrypt.HashPassword(newPassword);
            account.PasswordResetToken         = null;
            account.PasswordResetTokenExpireAt = null;
            account.MustChangePassword         = false;
            account.UpdatedAt                  = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            _logger.LogInformation("Password reset successfully for account {AccountId}", account.AccountId);
            return (true, null);
        }

        // ─────────────────────────────────────────────────────────────────────
        // Change password — người dùng tự đổi sau khi xác minh mật khẩu cũ
        // ─────────────────────────────────────────────────────────────────────
        public async Task<(bool Success, string? Error)> ChangePasswordAsync(
            string accountId, string oldPassword, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(oldPassword) || string.IsNullOrWhiteSpace(newPassword))
                return (false, "Mật khẩu cũ và mật khẩu mới không được để trống.");

            if (!IsPasswordStrong(newPassword))
                return (false, "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ cái và số.");

            var account = await _db.Accounts
                .FirstOrDefaultAsync(a => a.AccountId == accountId && a.DeletedAt == null);

            if (account is null)
                return (false, "Không tìm thấy tài khoản.");

            if (!BCrypt.Net.BCrypt.Verify(oldPassword, account.PasswordHash))
                return (false, "Mật khẩu cũ không đúng.");

            account.PasswordHash       = BCrypt.Net.BCrypt.HashPassword(newPassword);
            account.MustChangePassword = false;
            account.UpdatedAt          = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return (true, null);
        }

        // ─────────────────────────────────────────────────────────────────────
        // Get profile — lấy thông tin account theo accountId từ JWT claim
        // ─────────────────────────────────────────────────────────────────────
        public async Task<AccountDto?> GetAccountProfileAsync(string accountId)
        {
            var account = await _db.Accounts.AsNoTracking()
                .FirstOrDefaultAsync(a => a.AccountId == accountId && a.DeletedAt == null);

            if (account is null)
                return null;

            return new AccountDto(
                account.AccountId,
                account.Username,
                account.Role,
                account.FullName,
                account.Email,
                account.PhoneNumber,
                account.IsLocked,
                account.SubscriptionPlanId,
                account.CreatedAt,
                account.UpdatedAt);
        }

        // ── Helper ─────────────────────────────────────────────────────────────
        private static bool IsPasswordStrong(string password)
        {
            if (password.Length < 8) return false;
            return password.Any(char.IsLetter) && password.Any(char.IsDigit);
        }
    }
}
