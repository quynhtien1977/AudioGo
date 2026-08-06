namespace Server.Services.Interfaces
{
    public interface IEmailService
    {
        /// <summary>
        /// Gửi email chào mừng + mật khẩu tạm thời khi Admin tạo tài khoản mới.
        /// </summary>
        /// <returns>true nếu gửi thành công, false nếu thất bại</returns>
        Task<bool> SendAccountCreatedEmailAsync(
            string toEmail,
            string fullName,
            string username,
            string temporaryPassword,
            string? phoneNumber = null);

        /// <summary>
        /// Gửi email chứa link đặt lại mật khẩu.
        /// </summary>
        /// <returns>true nếu gửi thành công, false nếu thất bại</returns>
        /// <summary>
        /// Gửi email chứa link đặt lại mật khẩu.
        /// </summary>
        /// <returns>true nếu gửi thành công, false nếu thất bại</returns>
        Task<bool> SendPasswordResetEmailAsync(
            string toEmail,
            string fullName,
            string resetLink);

        /// <summary>
        /// Gửi email thông báo cho Admin khi có yêu cầu tư vấn mới từ landing page.
        /// </summary>
        Task<bool> SendConsultationNotificationAsync(
            string adminEmail,
            string fullName,
            string restaurantName,
            string phoneNumber,
            string? email,
            string  area,
            string? message);
    }
}
