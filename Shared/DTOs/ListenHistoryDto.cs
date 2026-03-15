namespace Shared.DTOs
{
    public record ListenHistoryRequest(
        string DeviceId,
        string PoiId,
        int ListenDuration
    );

    public record ListenHistoryResponse(
        string HistoryId,
        string DeviceId,
        string PoiId,
        DateTime Timestamp,
        int ListenDuration
    );
}
