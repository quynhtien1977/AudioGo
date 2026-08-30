namespace Server.Models
{
    /// <summary>
    /// Thông báo nội bộ CMS.
    /// Fan-out pattern: 1 row = 1 người nhận — tránh bug isRead shared khi broadcast.
    /// RecipientAccountId = null  → broadcast công khai (dùng cho mobile tourist).
    /// RecipientAccountId có giá trị → thông báo riêng tư cho account cụ thể.
    /// </summary>
    public class Notification
    {
        public string NotificationId { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// FK → Account.AccountId.
        /// NULL = broadcast công khai (không cần đăng nhập để đọc, dùng cho mobile).
        /// </summary>
        public string? RecipientAccountId { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Body  { get; set; } = string.Empty;

        /// <summary>
        /// Loại thông báo:
        /// "Broadcast"          — Admin gửi thủ công tới 1 nhóm role
        /// "PoiApproved"        — POI request được duyệt
        /// "PoiRejected"        — POI request bị từ chối
        /// "SubscriptionExpiring" — Gói cước sắp hết hạn (7 ngày)
        /// "PlanAssigned"       — Admin gán gói mới
        /// "PoiHidden"          — POI bị ẩn do vượt giới hạn
        /// </summary>
        public string Type { get; set; } = "Broadcast";

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>null nếu do hệ thống tự tạo.</summary>
        public string? CreatedByAccountId { get; set; }

        // ── Navigation Properties ──────────────────────────────────────────────
        public Account? RecipientAccount  { get; set; }
        public Account? CreatedByAccount  { get; set; }
    }
}
