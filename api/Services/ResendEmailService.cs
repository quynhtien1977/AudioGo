using System.Text;
using System.Text.Json;
using Server.Services.Interfaces;

namespace Server.Services
{
    /// <summary>
    /// Triển khai IEmailService dùng Resend REST API.
    /// Docs: https://resend.com/docs/api-reference/emails/send-email
    /// </summary>
    public class ResendEmailService : IEmailService
    {
        private readonly HttpClient  _http;
        private readonly IConfiguration _config;
        private readonly ILogger<ResendEmailService> _logger;

        public ResendEmailService(HttpClient http, IConfiguration config, ILogger<ResendEmailService> logger)
        {
            _http   = http;
            _config = config;
            _logger = logger;

            var apiKey = _config["EmailSettings:ResendApiKey"] ?? "";
            _http.BaseAddress = new Uri("https://api.resend.com/");
            _http.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
        }

        // ─── Send account created email ───────────────────────────────────────
        public async Task<bool> SendAccountCreatedEmailAsync(
            string toEmail, string fullName, string username, string temporaryPassword, string? phoneNumber = null)
        {
            var fromName  = _config["EmailSettings:FromName"]  ?? "AudioGo";
            var fromEmail = _config["EmailSettings:FromEmail"] ?? "";
            var cmsUrl    = _config["EmailSettings:CmsBaseUrl"] ?? "http://localhost:5173";

            var phoneLine = string.IsNullOrWhiteSpace(phoneNumber) ? "" : $"""
                    <p style="margin: 8px 0;"><strong>Số điện thoại:</strong> {phoneNumber}</p>
            """;

            var html = $"""
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
                  <div style="text-align:center; margin-bottom: 24px;">
                    <h1 style="color: #EE4B8E; margin: 0;">AudioGo</h1>
                    <p style="color:#888; margin:4px 0 0;">Hệ thống quản lý âm thanh du lịch</p>
                  </div>
                  <hr style="border: none; border-top: 1px solid #f0c0d0; margin: 20px 0;" />
                  <p>Xin chào <strong>{fullName}</strong>,</p>
                  <p>Tài khoản CMS của bạn đã được tạo bởi quản trị viên. Dưới đây là thông tin tài khoản:</p>
                  
                  <div style="background:#FFF0F5; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: bold; color: #A3437B;">Thông tin tài khoản</p>
                    <p style="margin: 8px 0;"><strong>Họ và tên:</strong> {fullName}</p>
                    <p style="margin: 8px 0;"><strong>Email:</strong> {toEmail}</p>
                    {phoneLine}
                    <p style="margin: 8px 0;"><strong>Tên đăng nhập:</strong> <code style="background:#fff; padding: 2px 8px; border-radius:4px;">{username}</code></p>
                  </div>

                  <div style="background:#fff; border: 1.5px solid #ffc107; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #856404;">Mật khẩu tạm thời</p>
                    <p style="margin: 0 0 12px 0; font-size: 13px; color: #856404;">Dùng mật khẩu này để đăng nhập lần đầu tiên:</p>
                    <div style="text-align: center; padding: 12px; background: #fff3cd; border-radius: 8px;">
                        <code style="font-size: 20px; font-weight: bold; letter-spacing: 4px; color: #A3437B;">{temporaryPassword}</code>
                    </div>
                  </div>

                  <div style="text-align:center; margin: 28px 0;">
                    <a href="{cmsUrl}"
                       style="background: linear-gradient(135deg, #A3437B, #F172AC); color: white; padding: 14px 32px;
                              text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px;">
                      Đăng nhập ngay
                    </a>
                  </div>
                  <p style="color: #E53E3E; background: #FFF5F5; border-radius:8px; padding: 12px; font-size: 14px;">
                    <strong>Bảo mật:</strong> Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu tại trang
                    <strong>Hồ sơ cá nhân</strong> để bảo vệ tài khoản của bạn.
                  </p>
                  <hr style="border: none; border-top: 1px solid #f0c0d0; margin: 20px 0;" />
                  <p style="color:#aaa; font-size:12px; text-align:center;">
                    Email này được gửi tự động từ hệ thống AudioGo. Vui lòng không trả lời.
                  </p>
                </body>
                </html>
                """;

            return await SendAsync(fromEmail, fromName, toEmail, "Thông tin tài khoản AudioGo CMS của bạn", html);
        }

        // ─── Send password reset email ─────────────────────────────────────────
        public async Task<bool> SendPasswordResetEmailAsync(
            string toEmail, string fullName, string resetLink)
        {
            var fromName  = _config["EmailSettings:FromName"]  ?? "AudioGo";
            var fromEmail = _config["EmailSettings:FromEmail"] ?? "";

            var html = $"""
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
                  <div style="text-align:center; margin-bottom: 24px;">
                    <h1 style="color: #EE4B8E; margin: 0;">AudioGo</h1>
                    <p style="color:#888; margin:4px 0 0;">Đặt lại mật khẩu</p>
                  </div>
                  <hr style="border: none; border-top: 1px solid #f0c0d0; margin: 20px 0;" />
                  <p>Xin chào <strong>{fullName}</strong>,</p>
                  <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
                     Click vào nút bên dưới để tiếp tục:</p>
                  <div style="text-align:center; margin: 28px 0;">
                    <a href="{resetLink}"
                       style="background: linear-gradient(135deg, #A3437B, #F172AC); color: white; padding: 14px 32px;
                              text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px;">
                      Đặt lại mật khẩu
                    </a>
                  </div>
                  <p style="color:#888; font-size: 13px;">
                    Hoặc copy link sau vào trình duyệt:<br/>
                    <span style="color:#EE4B8E;">{resetLink}</span>
                  </p>
                  <p style="color: #E53E3E; background: #FFF5F5; border-radius:8px; padding: 12px; font-size: 14px;">
                    Link này sẽ hết hạn sau <strong>30 phút</strong>.
                    Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
                  </p>
                  <hr style="border: none; border-top: 1px solid #f0c0d0; margin: 20px 0;" />
                  <p style="color:#aaa; font-size:12px; text-align:center;">
                    Email này được gửi tự động từ hệ thống AudioGo. Vui lòng không trả lời.
                  </p>
                </body>
                </html>
                """;

            return await SendAsync(fromEmail, fromName, toEmail, "Đặt lại mật khẩu AudioGo CMS", html);
        }

        // ─── Core send method ──────────────────────────────────────────────────
        private async Task<bool> SendAsync(string fromEmail, string fromName, string toEmail, string subject, string html)
        {
            try
            {
                var payload = new
                {
                    from    = $"{fromName} <{fromEmail}>",
                    to      = new[] { toEmail },
                    subject = subject,
                    html    = html
                };

                var json    = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _http.PostAsync("emails", content);

                if (!response.IsSuccessStatusCode)
                {
                    var body = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("[ResendEmail] Gửi thất bại ({Code}): {Body}", response.StatusCode, body);
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ResendEmail] Lỗi khi gửi email tới {To}", toEmail);
                return false;
            }
        }

        // ─── Consultation notification for Admin ──────────────────────────────
        public async Task<bool> SendConsultationNotificationAsync(
            string adminEmail,
            string fullName,
            string restaurantName,
            string phoneNumber,
            string? email,
            string  area,
            string? message)
        {
            var fromEmail = _config["EmailSettings:FromEmail"] ?? "noreply@audiogo.vn";
            var fromName  = _config["EmailSettings:FromName"]  ?? "AudioGo";

            var emailRow = string.IsNullOrEmpty(email)
                ? "<tr><td style='padding:4px 0;color:#6b7280'>Email</td><td style='padding:4px 0;color:#374151'>—</td></tr>"
                : $"<tr><td style='padding:4px 0;color:#6b7280'>Email</td><td style='padding:4px 0;color:#374151'>{email}</td></tr>";

            var messageRow = string.IsNullOrEmpty(message)
                ? ""
                : $"<tr><td style='padding:4px 0;color:#6b7280;vertical-align:top'>Tin nhắn</td><td style='padding:4px 0;color:#374151'>{message}</td></tr>";

            var html = $"""
                <!DOCTYPE html>
                <html lang="vi">
                <head><meta charset="UTF-8"><title>Yêu cầu tư vấn mới</title></head>
                <body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,sans-serif">
                  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
                    <div style="background:linear-gradient(135deg,#f43f5e,#fb923c);padding:24px 32px">
                      <p style="margin:0;color:#fff;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase">AudioGo CMS</p>
                      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700">Yêu cầu tư vấn mới</h1>
                    </div>
                    <div style="padding:24px 32px">
                      <p style="margin:0 0 20px;color:#374151">Có chủ quán mới đăng ký qua Landing Page. Thông tin chi tiết:</p>
                      <table style="width:100%;border-collapse:collapse;font-size:14px">
                        <tr><td style='padding:4px 0;color:#6b7280;width:110px'>Họ tên</td><td style='padding:4px 0;color:#111827;font-weight:600'>{fullName}</td></tr>
                        <tr><td style='padding:4px 0;color:#6b7280'>Tên quán</td><td style='padding:4px 0;color:#111827;font-weight:600'>{restaurantName}</td></tr>
                        <tr><td style='padding:4px 0;color:#6b7280'>Số điện thoại</td><td style='padding:4px 0;color:#111827;font-weight:700;font-size:16px'>{phoneNumber}</td></tr>
                        <tr><td style='padding:4px 0;color:#6b7280'>Khu vực</td><td style='padding:4px 0;color:#374151'>{area}</td></tr>
                        {emailRow}
                        {messageRow}
                      </table>
                      <div style="margin:24px 0 0;padding:16px;background:#fef3c7;border-radius:8px;border-left:4px solid #f59e0b">
                        <p style="margin:0;font-size:13px;color:#92400e">Hãy liên hệ trong vòng 24 giờ để đảm bảo trải nghiệm tốt nhất cho đối tác.</p>
                      </div>
                    </div>
                    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
                      <p style="margin:0;font-size:12px;color:#9ca3af">Email này được gửi tự động từ hệ thống AudioGo CMS.</p>
                    </div>
                  </div>
                </body>
                </html>
                """;

            var payload = new
            {
                from    = $"{fromName} <{fromEmail}>",
                to      = new[] { adminEmail },
                subject = $"[AudioGo] Yêu cầu tư vấn mới — {restaurantName}",
                html
            };

            try
            {
                var json    = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _http.PostAsync("emails", content);
                if (!response.IsSuccessStatusCode)
                {
                    var body = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("[ResendEmail] Consultation notification thất bại ({Code}): {Body}", response.StatusCode, body);
                    return false;
                }
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ResendEmail] Lỗi khi gửi consultation notification tới {To}", adminEmail);
                return false;
            }
        }
    }
}
