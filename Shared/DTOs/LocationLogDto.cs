namespace Shared.DTOs
{
    public class LocationLogBatchRequest
    {
        public string DeviceId { get; set; } = string.Empty;
        public List<LocationPoint> Points { get; set; } = new();
    }

    public class LocationPoint
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
