namespace Server.Models
{
    /// <summary>
    /// Lưu lại 1 đợt phát thông báo broadcast của Admin.
    /// Fan-out N rows sang bảng Notification, bảng này giữ thông tin tóm gọn mỗi chiến dịch.
    /// </summary>
    public class BroadcastCampaign
    {
        public string CampaignId { get; set; } = Guid.NewGuid().ToString();

        public string Title { get; set; } = string.Empty;
        public string Body  { get; set; } = string.Empty;

        /// <summary>
        /// JSON array — ví dụ: ["Owner","Editor"] hoặc ["Public"].
        /// </summary>
        public string TargetRolesJson { get; set; } = "[]";

        /// <summary>Số tài khoản thực tế nhận được (sau fan-out).</summary>
        public int RecipientCount { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Admin đã gửi. Null nếu do hệ thống tự động.</summary>
        public string? CreatedByAccountId { get; set; }

        // ── Navigation Properties ──────────────────────────────────────────────
        public Account? CreatedByAccount { get; set; }
    }
}
