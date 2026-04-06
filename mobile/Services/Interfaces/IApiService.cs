using Shared;

namespace AudioGo.Services.Interfaces
{
    public interface IApiService
    {
        Task<List<POI>> GetPoisAsync(string? languageCode = null, string? query = null, string? category = null, CancellationToken ct = default);
        Task<List<Shared.DTOs.TourSummaryDto>> GetToursAsync(string? languageCode = null, string? query = null, CancellationToken ct = default);
        Task<List<Shared.DTOs.CategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
        Task PostListenHistoryAsync(string poiId, string deviceId, int durationSeconds, CancellationToken ct = default);
        Task PostLocationLogAsync(string deviceId, double latitude, double longitude, CancellationToken ct = default);
        Task<bool> CreateTourAsync(Shared.DTOs.TourCreateRequest request, CancellationToken ct = default);
    }
}
