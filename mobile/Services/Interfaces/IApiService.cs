using Shared;

namespace AudioGo.Services.Interfaces
{
    public interface IApiService
    {
        Task<List<POI>> GetPoisAsync(string? languageCode = null, CancellationToken ct = default);
        Task PostListenHistoryAsync(string poiId, string deviceId, int durationSeconds, CancellationToken ct = default);
        Task PostLocationLogAsync(string deviceId, double latitude, double longitude, CancellationToken ct = default);
    }
}
