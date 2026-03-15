namespace Server.Models
{
    public class ListenHistory
    {
        public string HistoryId { get; set; } = string.Empty;
        public string DeviceId { get; set; } = string.Empty;
        public string PoiId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public int ListenDuration { get; set; }

        // Navigation
        public Poi? Poi { get; set; }
    }
}
