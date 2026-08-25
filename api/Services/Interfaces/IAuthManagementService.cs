using Shared.DTOs;

namespace Server.Services.Interfaces
{
    /// <summary>
    /// Quản lý các nghiệp vụ auth phức tạp: forgot/reset password, change password, get profile.
    /// Tách khỏi AuthController để tuân thủ SRP và dễ unit-test.
    /// </summary>
    public interface IAuthManagementService
    {
        /// <summary>
        /// Sinh reset-token, lưu vào account và gửi email hướng dẫn đặt lại mật khẩu.
        /// Trả về true nếu email tồn tại (để ghi log nội bộ); response HTTP luôn 200 dù kết quả nào.
        /// </summary>
        Task<bool> SendPasswordResetEmailAsync(string email);

        /// <summary>
        /// Xác minh token, validate độ mạnh mật khẩu mới, cập nhật hash và xóa token.
        /// Trả về (success, errorMessage).
        /// </summary>
        Task<(bool Success, string? Error)> ResetPasswordAsync(string token, string newPassword);

        /// <summary>
        /// Người dùng tự đổi mật khẩu sau khi xác minh mật khẩu cũ.
        /// Trả về (success, errorMessage).
        /// </summary>
        Task<(bool Success, string? Error)> ChangePasswordAsync(string accountId, string oldPassword, string newPassword);

        /// <summary>
        /// Lấy thông tin profile của account hiện tại theo accountId từ JWT claim.
        /// Trả về null nếu account không tồn tại hoặc đã bị xóa.
        /// </summary>
        Task<AccountDto?> GetAccountProfileAsync(string accountId);
    }
}
