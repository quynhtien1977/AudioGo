namespace Shared.DTOs
{
    public class DashboardStatsDto
    {
        public int TotalListens { get; set; }
        public List<DailyListenDto> DailyListens { get; set; }
    }

    public class DailyListenDto
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
    }

    // ── Device Activity Timeline ─────────────────────────────────────────────
    public record DeviceActivityEventDto(
        string EventType,      // "location" | "listen"
        DateTime Timestamp,
        double? Latitude,
        double? Longitude,
        string? PoiId,
        string? PoiTitle,
        int? ListenDuration    // giây
    );

    public record DeviceActivityDto(
        string DeviceId,
        DateTime? FirstSeen,
        DateTime? LastSeen,
        int TotalLocations,
        int TotalListens,
        List<DeviceActivityEventDto> Timeline
    );
}