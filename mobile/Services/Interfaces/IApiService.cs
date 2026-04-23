using Shared;
using Shared.DTOs;

namespace AudioGo.Services.Interfaces
{
    public interface IApiService
    {
        Task<List<POI>> GetPoisAsync(string? languageCode = null, string? query = null, string? category = null, CancellationToken ct = default);
        Task<List<TourSummaryDto>> GetToursAsync(string? languageCode = null, string? query = null, CancellationToken ct = default);
        Task<List<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
        Task PostListenHistoryAsync(string poiId, string deviceId, int durationSeconds, CancellationToken ct = default);
        Task PostLocationLogAsync(string deviceId, double latitude, double longitude, CancellationToken ct = default);
        Task<bool> CreateTourAsync(TourCreateRequest request, CancellationToken ct = default);
        Task<(bool IsSuccess, string Message, string? Token)> ScanQrAsync(string code, string deviceId, CancellationToken ct = default);

        /// <summary>
        /// Lấy delta thay đổi kể từ <paramref name="since"/> (UTC).
        /// Trả null nếu lỗi network (caller sẽ bỏ qua, không crash).
        /// </summary>
        Task<PoiDeltaDto?> GetDeltaAsync(DateTime since, string languageCode, CancellationToken ct = default);
    }
}

