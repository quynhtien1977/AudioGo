namespace Server.Models
{
    public class LocationLog
    {
        public string LocationId { get; set; } = string.Empty;
        public string DeviceId { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
