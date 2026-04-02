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
}
