namespace Shared.DTOs
{
    public record LocationLogBatchRequest(
        string DeviceId,
        IReadOnlyList<LocationPoint> Points
    );

    public record LocationPoint(
        double Latitude,
        double Longitude,
        DateTime Timestamp
    );
}
