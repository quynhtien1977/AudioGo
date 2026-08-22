namespace Server.Models
{
    /// <summary>
    /// Gói đăng ký đang hoạt động của từng Owner.
    /// Một Account chỉ có tối đa 1 subscription ở trạng thái ACTIVE tại một thời điểm
    /// (được đảm bảo bởi partial unique index IX_OwnerSubscription_Account_Active).
    /// </summary>
    public class OwnerSubscription
    {
        public string SubscriptionId { get; set; } = Guid.NewGuid().ToString();

        /// <summary>FK → Account.AccountId</summary>
        public string AccountId { get; set; } = string.Empty;

        /// <summary>FK → SubscriptionPlan.PlanId — 'basic' | 'professional' | 'enterprise'</summary>
        public string PlanId { get; set; } = "basic";

        /// <summary>Trạng thái: ACTIVE | EXPIRED | CANCELLED</summary>
        public string Status { get; set; } = "ACTIVE";

        public DateTime StartDate { get; set; } = DateTime.UtcNow;

        /// <summary>Ngày hết hạn = StartDate + SubscriptionPlan.DurationDay</summary>
        public DateTime EndDate { get; set; }

        /// <summary>Tự động gia hạn khi hết hạn (chưa triển khai trong v1).</summary>
        public bool AutoRenew { get; set; } = false;

        /// <summary>
        /// Thời điểm kết thúc grace period khi downgrade gói (giảm MaxPoiCount).
        /// NULL = không có grace period.
        /// Nếu đến thời điểm này mà vẫn vượt giới hạn POI → background job tự ẩn POI thừa.
        /// Owner có 3 ngày để tự dọn hoặc upgrade lại.
        /// </summary>
        public DateTime? PoiGracePeriodUntil { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // ── Navigation Properties ────────────────────────────────────────────
        public Account?          Account { get; set; }
        public SubscriptionPlan? Plan    { get; set; }
    }
}
