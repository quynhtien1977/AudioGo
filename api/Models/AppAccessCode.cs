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
    }
}
