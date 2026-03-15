using AudioGo.Data;
using AudioGo.Models;
using AudioGo.Services.Interfaces;
using Shared;

namespace AudioGo.Services
{
    /// <summary>
    /// Đồng bộ POI từ server về SQLite local.
    /// Nếu offline, đọc từ cache. Nếu online, fetch và cập nhật cache.
    /// </summary>
    public class SyncService
    {
        private readonly IApiService _api;
        private readonly AppDatabase _db;

        public SyncService(IApiService api, AppDatabase db)
        {
            _api = api;
            _db = db;
        }

        /// <summary>Trả về POI list: ưu tiên dữ liệu server, fallback về cache.</summary>
        public async Task<List<POI>> GetPoisAsync(string languageCode = "vi")
        {
            if (Connectivity.NetworkAccess == NetworkAccess.Internet)
            {
                try
                {
                    var serverPois = await _api.GetPoisAsync(languageCode);
                    await CacheAsync(serverPois);
                    return serverPois;
                }
                catch
                {
                    // Network lỗi → dùng cache
                }
            }

            return (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();
        }

        private async Task CacheAsync(List<POI> pois)
        {
            foreach (var poi in pois)
                await _db.SavePoiAsync(MapToEntity(poi));
        }

        private static PoiEntity MapToEntity(POI dto) => new()
        {
            PoiId = dto.PoiId,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            ActivationRadius = dto.ActivationRadius,
            Priority = dto.Priority,
            Status = dto.Status,
            LogoUrl = dto.LogoUrl,
            LanguageCode = dto.LanguageCode,
            Title = dto.Title,
            Description = dto.Description,
            AudioUrl = dto.AudioUrl,
            LocalAudioPath = dto.LocalAudioPath,
            LastSyncedAt = DateTime.UtcNow
        };

        private static POI MapToDto(PoiEntity e) => new()
        {
            PoiId = e.PoiId,
            Latitude = e.Latitude,
            Longitude = e.Longitude,
            ActivationRadius = e.ActivationRadius,
            Priority = e.Priority,
            Status = e.Status,
            LogoUrl = e.LogoUrl,
            LanguageCode = e.LanguageCode,
            Title = e.Title,
            Description = e.Description,
            AudioUrl = e.AudioUrl,
            LocalAudioPath = e.LocalAudioPath
        };
    }
}
