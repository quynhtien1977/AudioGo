namespace Server.Models
{
    public class Account
    {
        public string AccountId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsLocked { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Cột shortcut — gói đăng ký hiện tại của Owner.
        /// Mặc định 'basic' vì Admin luôn gán gói khi tạo tài khoản (không có free tier).
        /// Được cập nhật đồng bộ mỗi khi OwnerSubscription thay đổi.
        /// Chỉ có ý nghĩa với Role = 'Owner'.
        /// </summary>
        public string SubscriptionPlanId { get; set; } = "basic";

        // ── Navigation Properties ────────────────────────────────────────────
        public SubscriptionPlan?              SubscriptionPlan  { get; set; }
        public ICollection<OwnerSubscription> Subscriptions     { get; set; } = [];
        public ICollection<PaymentTransaction> Transactions     { get; set; } = [];
    }
}
