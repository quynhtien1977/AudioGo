namespace Server.Models
{
    public class AppAccessCode
    {
        public int CodeId { get; set; }
        
        /// <summary>
        /// Mã quét từ QR, nên sinh đủ dài và khó đoán (Vd: AG-88X9-22B1)
        /// </summary>
        public string Code { get; set; } = string.Empty;
        
        /// <summary>
        /// Mã của máy khách để khoá mã QR này với duy nhất thiết bị đó (ví dụ UID phần cứng)
        /// null nghĩa là vé trắng, chưa có người nào quét.
        /// </summary>
        public string? UsedByDeviceId { get; set; }
        
        /// <summary>
        /// Thời điểm khách bắt đầu kích hoạt mã này
        /// </summary>
        public DateTime? ActivatedAt { get; set; }
        
        /// <summary>
        /// Thời điểm mã này hết hạn (thường là ActivatedAt + 7 ngày)
        /// </summary>
        public DateTime? ExpireAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Loại mã: 'TRIAL' (Admin tạo thủ công) | 'SUBSCRIPTION' (Sinh tự động sau thanh toán).
        /// </summary>
        public string Type { get; set; } = "TRIAL";

        /// <summary>FK → SubscriptionPlan.PlanId. NULL với mã TRIAL thông thường.</summary>
        public string? PlanId { get; set; }

        /// <summary>
        /// Override số ngày hiệu lực khác với SubscriptionPlan.DurationDay nếu cần.
        /// NULL = dùng mặc định của gói (hoặc 7 ngày cho TRIAL).
        /// </summary>
        public int? DurationDay { get; set; }

        // ── Navigation Properties ────────────────────────────────────────────
        public SubscriptionPlan? Plan { get; set; }
    }
}
