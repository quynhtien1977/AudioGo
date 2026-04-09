using AudioGo.Data;
using AudioGo.Models;
using AudioGo.Services.Interfaces;
using Shared;
using Shared.DTOs;

namespace AudioGo.Services
{
    /// <summary>
    /// Đồng bộ POI từ server về SQLite local.
    /// Nếu offline, đọc từ cache. Nếu online, fetch → cache metadata → download audio.
    /// 
    /// Flow ngôn ngữ:
    ///   1. Lấy system language device (caller truyền vào)
    ///   2. Gửi request API với lang đó
    ///   3. Backend lazy-generate (translate + TTS) nếu chưa có → trả AudioUrl
    ///   4. SyncService download file .mp3 về LocalAudioPath
    /// </summary>
    public class SyncService
    {
        private readonly IApiService _api;
        private readonly AppDatabase _db;
        private readonly IHttpClientFactory _httpFactory;

        public SyncService(IApiService api, AppDatabase db, IHttpClientFactory httpFactory)
        {
            _api = api;
            _db = db;
            _httpFactory = httpFactory;
        }

        /// <summary>
        /// Trả về POI list: ưu tiên dữ liệu server, fallback về cache.
        /// Sau khi lấy server data, tự động download audio nền.
        /// </summary>
        public async Task<List<POI>> GetPoisAsync(string languageCode = "vi", CancellationToken ct = default)
        {
            // Không dùng Connectivity.NetworkAccess vì Android WiFi thật
            // đôi khi trả về Local/ConstrainedInternet thay vì Internet.
            // Thay vào đó: thử gọi API thẳng — nếu thành công thì dùng,
            // nếu timeout/lỗi thì fallback về SQLite cache.
            try
            {
                var serverPois = await _api.GetPoisAsync(languageCode: languageCode, ct: ct);

                if (serverPois.Count > 0)
                {
                    // Cache metadata trước để app dùng được ngay
                    await CacheMetadataAsync(serverPois);

                    // Download audio and image files nền (không block UI)
                    _ = Task.Run(() => DownloadAudioFilesAsync(serverPois, ct), ct);
                    _ = Task.Run(() => DownloadImageFilesAsync(serverPois, ct), ct);

                    // Đọc lại từ DB (giữ LocalAudioPath cũ nếu có)
                    return (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();
                }
            }
            catch
            {
                // API không kết nối được → fallback về cache
            }

            // Fallback: đọc từ SQLite cache (offline)
            return (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();
        }

        /// <summary>
        /// Lấy danh sách Categories: ưu tiên API, nếu offline thì extract từ các POI đã cache trong SQLite.
        /// </summary>
        public async Task<List<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
        {
            try
            {
                var apiCategories = await _api.GetCategoriesAsync(ct);
                if (apiCategories.Count > 0) return apiCategories;
            }
            catch
            {
                // API không kết nối được
            }

            // Fallback: extract từ SQLite cache
            var cachedPois = await _db.GetAllPoisAsync();
            var offlineCategories = cachedPois
                .Where(p => !string.IsNullOrEmpty(p.CategoriesJson))
                .SelectMany(p => System.Text.Json.JsonSerializer.Deserialize<List<string>>(p.CategoriesJson) ?? new())
                .Distinct()
                .Select(cName => new CategoryDto("", cName, 0, DateTime.MinValue, DateTime.MinValue))
                .ToList();

            return offlineCategories;
        }

        // ── Private Helpers ───────────────────────────────────────────────

        /// <summary>Lưu metadata POI xuống SQLite (không download audio).</summary>
        private async Task CacheMetadataAsync(List<POI> pois)
        {
            foreach (var poi in pois)
            {
                // Giữ lại LocalAudioPath cũ nếu file vẫn còn
                var existing = await _db.GetPoiAsync(poi.PoiId);
                var entity = MapToEntity(poi);

                if (existing is not null &&
                    !string.IsNullOrEmpty(existing.LocalAudioPath) &&
                    File.Exists(existing.LocalAudioPath))
                {
                    entity.LocalAudioPath = existing.LocalAudioPath;
                }

                if (existing is not null &&
                    !string.IsNullOrEmpty(existing.LocalLogoPath) &&
                    File.Exists(existing.LocalLogoPath))
                {
                    entity.LocalLogoPath = existing.LocalLogoPath;
                }

                await _db.SavePoiAsync(entity);
            }
        }

        /// <summary>
        /// Download audio files từ AudioUrl về local storage.
        /// Bỏ qua nếu file đã tồn tại (content-aware: so sánh URL để tái tải khi server thay đổi).
        /// </summary>
        private async Task DownloadAudioFilesAsync(List<POI> pois, CancellationToken ct)
        {
            var audioDir = Path.Combine(FileSystem.AppDataDirectory, "audio");
            Directory.CreateDirectory(audioDir);

            foreach (var poi in pois)
            {
                if (ct.IsCancellationRequested) break;
                if (string.IsNullOrEmpty(poi.AudioUrl)) continue;

                try
                {
                    var existing = await _db.GetPoiAsync(poi.PoiId);

                    // Tạo tên file duy nhất từ PoiId + LanguageCode
                    var fileName = $"{poi.PoiId}_{poi.LanguageCode}.mp3";
                    var localPath = Path.Combine(audioDir, fileName);

                    // Bỏ qua nếu file đã tồn tại và chưa thay đổi URL
                    if (File.Exists(localPath) &&
                        existing?.AudioUrl == poi.AudioUrl)
                    {
                        continue;
                    }

                    // Download file
                    using var http = _httpFactory.CreateClient();
                    var bytes = await http.GetByteArrayAsync(poi.AudioUrl, ct);
                    await File.WriteAllBytesAsync(localPath, bytes, ct);

                    // Cập nhật LocalAudioPath trong SQLite
                    if (existing is not null)
                    {
                        existing.LocalAudioPath = localPath;
                        existing.AudioUrl = poi.AudioUrl;
                        await _db.SavePoiAsync(existing);
                    }
                }
                catch (Exception ex)
                {
                    // Log và tiếp tục — không để 1 POI lỗi chặn cả batch
                    System.Diagnostics.Debug.WriteLine(
                        $"[SyncService] Download audio failed for POI {poi.PoiId}: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Download image logo files từ LogoUrl về local storage để cache map pin offline.
        /// </summary>
        private async Task DownloadImageFilesAsync(List<POI> pois, CancellationToken ct)
        {
            var imagesDir = Path.Combine(FileSystem.AppDataDirectory, "images");
            Directory.CreateDirectory(imagesDir);

            foreach (var poi in pois)
            {
                if (ct.IsCancellationRequested) break;
                if (string.IsNullOrEmpty(poi.LogoUrl)) continue;

                try
                {
                    var existing = await _db.GetPoiAsync(poi.PoiId);

                    // Parse the extension from URL if possible, otherwise default to .png
                    string extension = ".png";
                    try 
                    {
                        var uri = new Uri(poi.LogoUrl);
                        var ext = Path.GetExtension(uri.LocalPath);
                        if (!string.IsNullOrEmpty(ext)) extension = ext;
                    } 
                    catch { }

                    var fileName = $"{poi.PoiId}_logo{extension}";
                    var localPath = Path.Combine(imagesDir, fileName);

                    if (File.Exists(localPath) &&
                        existing?.LogoUrl == poi.LogoUrl)
                    {
                        continue;
                    }

                    using var http = _httpFactory.CreateClient();
                    var bytes = await http.GetByteArrayAsync(poi.LogoUrl, ct);
                    await File.WriteAllBytesAsync(localPath, bytes, ct);

                    if (existing is not null)
                    {
                        existing.LocalLogoPath = localPath;
                        existing.LogoUrl = poi.LogoUrl;
                        await _db.SavePoiAsync(existing);
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine(
                        $"[SyncService] Download logo failed for POI {poi.PoiId}: {ex.Message}");
                }
            }
        }

        private static PoiEntity MapToEntity(POI dto) => new()
        {
            PoiId            = dto.PoiId,
            Latitude         = dto.Latitude,
            Longitude        = dto.Longitude,
            ActivationRadius = dto.ActivationRadius,
            Priority         = dto.Priority,
            Status           = dto.Status ?? string.Empty,
            IsActive         = dto.IsActive,
            LogoUrl          = dto.LogoUrl,         // nullable OK
            LocalLogoPath    = dto.LocalLogoPath,
            LanguageCode     = dto.LanguageCode ?? "vi",
            Title            = dto.Title ?? string.Empty,
            Description      = dto.Description ?? string.Empty,
            AudioUrl         = dto.AudioUrl,         // nullable OK
            LocalAudioPath   = dto.LocalAudioPath,   // nullable OK
            // Serialise list to JSON for SQLite storage
            CategoriesJson   = dto.Categories?.Count > 0
                ? System.Text.Json.JsonSerializer.Serialize(dto.Categories)
                : string.Empty,
            GalleryUrlsJson  = dto.GalleryUrls?.Count > 0
                ? System.Text.Json.JsonSerializer.Serialize(dto.GalleryUrls)
                : string.Empty,
            LastSyncedAt     = DateTime.UtcNow
        };

        private static POI MapToDto(PoiEntity e) => new()
        {
            PoiId           = e.PoiId,
            Latitude        = e.Latitude,
            Longitude       = e.Longitude,
            ActivationRadius= e.ActivationRadius,
            Priority        = e.Priority,
            Status          = e.Status ?? string.Empty,
            IsActive        = e.IsActive,
            LogoUrl         = e.LogoUrl,           // nullable OK
            LocalLogoPath   = e.LocalLogoPath,
            LanguageCode    = e.LanguageCode ?? "vi",
            Title           = e.Title ?? string.Empty,
            Description     = e.Description ?? string.Empty,
            AudioUrl        = e.AudioUrl,           // nullable OK
            LocalAudioPath  = e.LocalAudioPath,     // nullable OK
            // Deserialise comma-separated categories stored in SQLite
            Categories      = string.IsNullOrEmpty(e.CategoriesJson)
                ? new()
                : System.Text.Json.JsonSerializer.Deserialize<List<string>>(e.CategoriesJson) ?? new(),
            GalleryUrls     = string.IsNullOrEmpty(e.GalleryUrlsJson)
                ? new()
                : System.Text.Json.JsonSerializer.Deserialize<List<string>>(e.GalleryUrlsJson) ?? new(),
        };
    }
}
