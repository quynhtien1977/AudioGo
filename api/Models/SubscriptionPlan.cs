namespace Server.Models
{
    /// <summary>
    /// Danh mục các gói đăng ký dành cho Owner (seed data, không thay đổi thường xuyên).
    /// 3 tier hiện tại: basic → professional → enterprise (đều tính phí).
    /// AutoPriority xác định mức ưu tiên POI được gán tự động khi Owner tạo mới.
    /// </summary>
    public class SubscriptionPlan
    {
        /// <summary>PK chuỗi cố định: 'basic' | 'professional' | 'enterprise'</summary>
        public string PlanId { get; set; } = string.Empty;

        /// <summary>Tên hiển thị: 'Cơ bản' | 'Chuyên nghiệp' | 'Doanh nghiệp'</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Giá theo tháng (VND). Tất cả gói đều tính phí.</summary>
        public decimal Price { get; set; } = 0;

        /// <summary>Số ngày hiệu lực kể từ ngày kích hoạt (mặc định 30 ngày).</summary>
        public int DurationDay { get; set; } = 30;

        /// <summary>
        /// Số POI tối đa được tạo. -1 = không giới hạn (Enterprise).
        /// Backend sẽ reject PoiRequest ngay khi vượt quá giới hạn này.
        /// </summary>
        public int MaxPoiCount { get; set; } = 3;

        /// <summary>
        /// Mức ưu tiên tự động gán cho POI mới của Owner này.
        /// 1 = LOW, 2 = MEDIUM, 3 = HIGH, 4 = CRITICAL (dành cho Admin gán thủ công).
        /// </summary>
        public int AutoPriority { get; set; } = 1;

        /// <summary>
        /// JSON array các tính năng kèm theo gói.
        /// Ví dụ: ["audio_guide","analytics","priority_support"]
        /// </summary>
        public string? Features { get; set; }

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ── Navigation Properties ────────────────────────────────────────────
        public ICollection<OwnerSubscription> Subscriptions { get; set; } = [];
    }
}
