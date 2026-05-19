namespace Shared.DTOs
{
    public class ListenHistoryRequest
    {
        public string DeviceId { get; set; } = string.Empty;
        public string PoiId { get; set; } = string.Empty;
        public int ListenDuration { get; set; }
    }

    public class ListenHistoryResponse
    {
        public string HistoryId { get; set; } = string.Empty;
        public string DeviceId { get; set; } = string.Empty;
        public string PoiId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public int ListenDuration { get; set; }
    }

    /// <summary>DTO trả về cho mobile để hiển thị mục "Tiếp tục nghe" trên trang chủ.</summary>
    public class ListenHistoryItemDto
    {
        public string PoiId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public DateTime LastListenedAt { get; set; }
        /// <summary>Tổng thời gian nghe (giây) — tính gộp tất cả lần nghe.</summary>
        public int TotalListenDuration { get; set; }
    }
}
