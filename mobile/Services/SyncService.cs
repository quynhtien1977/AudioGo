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
    public class SyncService : IDisposable
    {
        private readonly IApiService _api;
        private readonly AppDatabase _db;
        private readonly IHttpClientFactory _httpFactory;

        public SyncService(IApiService api, AppDatabase db, IHttpClientFactory httpFactory)
        {
            _api = api;
            _db = db;
            _httpFactory = httpFactory;

            // Khi mạng phục hồi → retry download các file còn thiếu
            Connectivity.ConnectivityChanged += OnConnectivityChanged;
        }

        private void OnConnectivityChanged(object? sender, ConnectivityChangedEventArgs e)
        {
            if (e.NetworkAccess == NetworkAccess.Internet || e.NetworkAccess == NetworkAccess.ConstrainedInternet)
            {
                _ = Task.Run(() => RetryPendingDownloadsAsync());
            }
        }

        /// <summary>
        /// Kẻt gọi khi app shutdown — hủy event subscription.
        /// </summary>
        public void Dispose()
        {
            Connectivity.ConnectivityChanged -= OnConnectivityChanged;
        }

        /// <summary>
        /// Retry các file chưa download (LocalAudioPath / LocalLogoPath = null và URL có sẵn).
        /// Được gọi tự động khi mạng phục hồi.
        /// </summary>
        public async Task RetryPendingDownloadsAsync(CancellationToken ct = default)
        {
            try
            {
                var allEntities = await _db.GetAllPoisAsync();
                // Map về POI DTO để reuse download helpers
                var pending = allEntities
                    .Select(MapToDto)
                    .Where(p => (!string.IsNullOrEmpty(p.AudioUrl) &&
                                 (string.IsNullOrEmpty(p.LocalAudioPath) || !File.Exists(p.LocalAudioPath)))
                             || (!string.IsNullOrEmpty(p.LogoUrl) &&
                                 (string.IsNullOrEmpty(p.LocalLogoPath) || !File.Exists(p.LocalLogoPath))))
                    .ToList();

                if (pending.Count == 0) return;

                System.Diagnostics.Debug.WriteLine(
                    $"[SyncService] Retrying downloads for {pending.Count} pending POIs");

                await DownloadAudioFilesAsync(pending, ct);
                await DownloadImageFilesAsync(pending, ct);
                await DownloadGalleryFilesAsync(pending, ct);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[SyncService] RetryPending error: {ex.Message}");
            }
        }

        /// <summary>
        /// Trả về POI list: cache-first (có cache → trả ngay + refresh nền);
        /// nếu cache rỗng → đợi server 1 lần rồi mới trả.
        /// </summary>
        public async Task<List<POI>> GetPoisAsync(string languageCode = "vi", CancellationToken ct = default)
        {
            var cached = (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();

            // ── CÓ CACHE: trả ngay, fetch server ngầm ──────────────────────────
            if (cached.Count > 0)
            {
                if (!AudioGo.Helpers.NetworkHelper.HasInternet()) return cached;

                // Background fetch — không block caller.
                // CancellationToken.None: download KHÔNG bị cancel khi user navigate đi.
                // Sequential Audio → Logo → Gallery: tránh tranh socket, ưu tiên audio trước.
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var serverPois = await _api.GetPoisAsync(languageCode: languageCode, ct: ct);
                        if (serverPois.Count > 0)
                        {
                            await CacheMetadataAsync(serverPois);
                            // Sequential: Audio trước (ưu tiên cao) → Logo → Gallery
                            await DownloadAudioFilesAsync(serverPois, CancellationToken.None);
                            await DownloadImageFilesAsync(serverPois, CancellationToken.None);
                            await DownloadGalleryFilesAsync(serverPois, CancellationToken.None);
                        }
                    }
                    catch
                    {
                        // offline → cache đã được trả rồi, không cần làm gì thêm
                    }
                });

                return cached;
            }

            // ── CACHE RỖNG (fresh install): chờ server 1 lần duy nhất ──────────
            if (!AudioGo.Helpers.NetworkHelper.HasInternet()) return cached;

            System.Diagnostics.Debug.WriteLine("[SyncService] Cache empty — waiting for server (GetPoisAsync)");
            try
            {
                var serverPois = await _api.GetPoisAsync(languageCode: languageCode, ct: ct);
                if (serverPois.Count > 0)
                {
                    await CacheMetadataAsync(serverPois);
                    // Sequential với CancellationToken.None — không bị cancel bởi navigation
                    _ = Task.Run(async () =>
                    {
                        await DownloadAudioFilesAsync(serverPois, CancellationToken.None);
                        await DownloadImageFilesAsync(serverPois, CancellationToken.None);
                        await DownloadGalleryFilesAsync(serverPois, CancellationToken.None);
                    });
                    return (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[SyncService] GetPoisAsync server fetch failed: {ex.Message}");
            }

            return cached; // empty list nếu offline và fresh install
        }

        /// <summary>
        /// Cache-first với live-refresh: trả cache ngay, fetch server nền,
        /// khi server trả về data mới sẽ gọi <paramref name="onRefreshed"/> để UI tự update.
        /// </summary>
        public async Task<List<POI>> GetPoisWithRefreshAsync(
            string languageCode,
            Func<List<POI>, Task> onRefreshed,
            Action<POI>? onSingleAudioReady = null,
            CancellationToken ct = default)
        {
            // Bước 1: trả cache ngay
            var cached = (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();

            System.Diagnostics.Debug.WriteLine($"[SyncService] Cache loaded: {cached.Count} POIs");

            // Bước 2a: Nếu CÓ cache → fetch server nền (không block caller)
            // Download sequential + CancellationToken.None: không bị cancel khi user navigate.
            if (cached.Count > 0)
            {
                if (!AudioGo.Helpers.NetworkHelper.HasInternet()) return cached;

                _ = Task.Run(async () =>
                {
                    try
                    {
                        var serverPois = await _api.GetPoisAsync(languageCode: languageCode, ct: ct);
                        if (serverPois.Count > 0)
                        {
                            await CacheMetadataAsync(serverPois);

                            // Sequential: Audio → Logo → Gallery
                            await DownloadAudioFilesAsync(serverPois, CancellationToken.None, onSingleAudioReady);
                            await DownloadImageFilesAsync(serverPois, CancellationToken.None);
                            await DownloadGalleryFilesAsync(serverPois, CancellationToken.None);

                            // Luôn reload từ SQLite sau khi download xong:
                            // LocalAudioPath/LocalLogoPath/GalleryLocalPaths đã được
                            // cập nhật trong DB, cần push lên RAM để UI dùng đúng.
                            var fresh = (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();
                            System.Diagnostics.Debug.WriteLine(
                                $"[SyncService] Assets downloaded → refreshing {fresh.Count} POIs in UI (LocalAudioPath + LocalLogoPath updated)");
                            await MainThread.InvokeOnMainThreadAsync(() => onRefreshed(fresh));
                        }
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"[SyncService] Background refresh error: {ex.Message}");
                        // offline → không refresh, cache đã được trả rồi
                    }
                });


                return cached;
            }

            // Bước 2b: Cache rỗng (fresh install / data cleared) → phải đợi server
            if (!AudioGo.Helpers.NetworkHelper.HasInternet()) return cached;

            System.Diagnostics.Debug.WriteLine("[SyncService] Cache empty — waiting for server (first run)");
            try
            {
                var serverPois = await _api.GetPoisAsync(languageCode: languageCode, ct: ct);
                if (serverPois.Count > 0)
                {
                    await CacheMetadataAsync(serverPois);
                    // Sequential với CancellationToken.None — không bị cancel bởi navigation
                    _ = Task.Run(async () =>
                    {
                        await DownloadAudioFilesAsync(serverPois, CancellationToken.None, onSingleAudioReady);
                        await DownloadImageFilesAsync(serverPois, CancellationToken.None);
                        await DownloadGalleryFilesAsync(serverPois, CancellationToken.None);
                    });
                    return (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[SyncService] First-run server fetch failed: {ex.Message}");
                // offline → trả list rỗng
            }

            return cached; // empty list
        }


        /// <summary>
        /// Lấy danh sách Categories: ưu tiên API, nếu offline thì extract từ các POI đã cache trong SQLite.
        /// </summary>
        public async Task<List<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
        {
            if (AudioGo.Helpers.NetworkHelper.HasInternet())
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
            }

            // Fallback: extract từ SQLite cache
            var cachedPois = await _db.GetAllPoisAsync();
            var offlineCategories = cachedPois
                .Where(p => !string.IsNullOrEmpty(p.CategoriesJson))
                .SelectMany(p => SafeDeserializeList(p.CategoriesJson))
                .Distinct()
                .Select(cName => new CategoryDto("", cName, 0, DateTime.MinValue, DateTime.MinValue))
                .ToList();

            return offlineCategories;
        }

        // ── Private Helpers ───────────────────────────────────────────────

        /// <summary>
        /// Lưu metadata POI xuống SQLite (không download audio).
        /// Tối ưu: load tất cả existing records 1 lần (batch) thay vì N lần GetPoiAsync.
        /// </summary>
        private async Task CacheMetadataAsync(List<POI> pois)
        {
            // Batch load tất cả existing POIs 1 lần duy nhất → tra cứu bằng Dictionary O(1)
            var allExisting = await _db.GetAllPoisAsync();
            var existingMap = allExisting.ToDictionary(e => e.PoiId);

            foreach (var poi in pois)
            {
                var entity = MapToEntity(poi);
                existingMap.TryGetValue(poi.PoiId, out var existing);

                // Giữ lại LocalAudioPath cũ nếu file vẫn còn
                if (existing is not null &&
                    !string.IsNullOrEmpty(existing.LocalAudioPath) &&
                    File.Exists(existing.LocalAudioPath))
                {
                    entity.LocalAudioPath = existing.LocalAudioPath;
                }

                // Giữ lại LocalLogoPath cũ nếu file vẫn còn
                if (existing is not null &&
                    !string.IsNullOrEmpty(existing.LocalLogoPath) &&
                    File.Exists(existing.LocalLogoPath))
                {
                    entity.LocalLogoPath = existing.LocalLogoPath;
                }

                // Giữ lại GalleryLocalPathsJson cũ nếu có
                if (existing is not null &&
                    !string.IsNullOrEmpty(existing.GalleryLocalPathsJson))
                {
                    entity.GalleryLocalPathsJson = existing.GalleryLocalPathsJson;
                }

                await _db.SavePoiAsync(entity);
            }
        }

        /// <summary>
        /// Download audio files từ AudioUrl về local storage.
        /// Bỏ qua nếu file đã tồn tại (content-aware: so sánh URL để tái tải khi server thay đổi).
        /// </summary>
        private async Task DownloadAudioFilesAsync(List<POI> pois, CancellationToken ct, Action<POI>? onSingleAudioReady = null)
        {
            var audioDir = Path.Combine(FileSystem.AppDataDirectory, "audio");
            Directory.CreateDirectory(audioDir);

            // ── FIX: Tạo HttpClient 1 lần ngoài loop — tránh socket exhaustion ──
            // CreateClient() bên trong loop tạo ra hàng chục HttpClient mới mỗi batch
            // → cạn pool socket Android (default ~256 sockets).
            using var http = _httpFactory.CreateClient("downloader");

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

                    // Download file — dùng client "downloader" (60s timeout) thay vì default 8s
                    var bytes = await http.GetByteArrayAsync(poi.AudioUrl, ct);
                    await File.WriteAllBytesAsync(localPath, bytes, ct);

                    // Cập nhật LocalAudioPath trong SQLite
                    if (existing is not null)
                    {
                        existing.LocalAudioPath = localPath;
                        existing.AudioUrl = poi.AudioUrl;
                        await _db.SavePoiAsync(existing);

                        poi.LocalAudioPath = localPath;
                        if (onSingleAudioReady != null)
                        {
                            MainThread.BeginInvokeOnMainThread(() => onSingleAudioReady(poi));
                        }
                    }

                    System.Diagnostics.Debug.WriteLine($"[SyncService] Audio downloaded: {poi.PoiId}");
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

            // ── FIX: HttpClient 1 lần ngoài loop ──
            using var http = _httpFactory.CreateClient("downloader");

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
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"[SyncService] Error parsing logo url: {ex.Message}");
                    }

                    var fileName = $"{poi.PoiId}_logo{extension}";
                    var localPath = Path.Combine(imagesDir, fileName);

                    if (File.Exists(localPath) &&
                        existing?.LogoUrl == poi.LogoUrl)
                    {
                        continue;
                    }

                    var bytes = await http.GetByteArrayAsync(poi.LogoUrl, ct);
                    await File.WriteAllBytesAsync(localPath, bytes, ct);

                    if (existing is not null)
                    {
                        existing.LocalLogoPath = localPath;
                        existing.LogoUrl = poi.LogoUrl;
                        await _db.SavePoiAsync(existing);
                    }

                    System.Diagnostics.Debug.WriteLine($"[SyncService] Logo downloaded: {poi.PoiId}");
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine(
                        $"[SyncService] Download logo failed for POI {poi.PoiId}: {ex.Message}");
                }
            }
        }
        /// <summary>
        /// Download gallery image files từ GalleryUrls về local storage để xem offline.
        /// Lưu các path vào GalleryLocalPathsJson trong SQLite.
        /// </summary>
        // ── Giới hạn max 3 kết nối song song cho gallery để không chiếm socket ──
        // Audio/Logo download sequential (1 kết nối) → ưu tiên cao hơn gallery.
        private static readonly SemaphoreSlim _gallerySemaphore = new(3, 3);

        private async Task DownloadGalleryFilesAsync(List<POI> pois, CancellationToken ct)
        {
            var galleryDir = Path.Combine(FileSystem.AppDataDirectory, "gallery");
            Directory.CreateDirectory(galleryDir);

            // ── FIX: HttpClient 1 lần ngoài loop, dùng chung cho cả batch ──
            using var http = _httpFactory.CreateClient("downloader");

            // Tải gallery song song, mỗi POI 1 task — nhưng throttled bởi _gallerySemaphore
            var tasks = pois
                .Where(p => p.GalleryUrls is { Count: > 0 })
                .Select(poi => DownloadGalleryForPoiAsync(poi, galleryDir, http, ct))
                .ToList();

            await Task.WhenAll(tasks);
        }

        private async Task DownloadGalleryForPoiAsync(
            POI poi, string galleryDir, HttpClient http, CancellationToken ct)
        {
            if (ct.IsCancellationRequested) return;

            try
            {
                var existing = await _db.GetPoiAsync(poi.PoiId);
                var localPaths = new List<string>();
                bool anyNew = false;

                for (int i = 0; i < poi.GalleryUrls!.Count; i++)
                {
                    if (ct.IsCancellationRequested) break;
                    var url = poi.GalleryUrls[i];
                    if (string.IsNullOrEmpty(url)) continue;

                    string extension = ".jpg";
                    try
                    {
                        var ext = Path.GetExtension(new Uri(url).LocalPath);
                        if (!string.IsNullOrEmpty(ext) && ext != ".") extension = ext;
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"[SyncService] Error parsing gallery url: {ex.Message}");
                    }

                    var fileName = $"{poi.PoiId}_gallery_{i}{extension}";
                    var localPath = Path.Combine(galleryDir, fileName);
                    localPaths.Add(localPath);

                    if (File.Exists(localPath)) continue; // đã có, bỏ qua

                    // Throttle: tối đa 3 kết nối gallery đồng thời
                    await _gallerySemaphore.WaitAsync(ct);
                    try
                    {
                        var bytes = await http.GetByteArrayAsync(url, ct);
                        await File.WriteAllBytesAsync(localPath, bytes, ct);
                        anyNew = true;
                        System.Diagnostics.Debug.WriteLine(
                            $"[SyncService] Gallery downloaded: {poi.PoiId}[{i}]");
                    }
                    finally
                    {
                        _gallerySemaphore.Release();
                    }
                }

                if (anyNew && existing is not null)
                {
                    existing.GalleryLocalPathsJson =
                        System.Text.Json.JsonSerializer.Serialize(localPaths);
                    await _db.SavePoiAsync(existing);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine(
                    $"[SyncService] Download gallery failed for POI {poi.PoiId}: {ex.Message}");
            }
        }

        private static PoiEntity MapToEntity(POI dto) => new()
        {
            PoiId            = dto.PoiId,
            Latitude         = dto.Latitude,
            Longitude        = dto.Longitude,
            ActivationRadius = dto.ActivationRadius,
            Priority         = dto.Priority,
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
            IsActive        = e.IsActive,
            LogoUrl         = e.LogoUrl,           // nullable OK
            LocalLogoPath   = e.LocalLogoPath,
            LanguageCode    = e.LanguageCode ?? "vi",
            Title           = e.Title ?? string.Empty,
            Description     = e.Description ?? string.Empty,
            AudioUrl        = e.AudioUrl,           // nullable OK
            LocalAudioPath  = e.LocalAudioPath,     // nullable OK
            // Deserialise comma-separated categories stored in SQLite (with fallback)
            Categories      = SafeDeserializeList(e.CategoriesJson),
            GalleryUrls     = SafeDeserializeList(e.GalleryUrlsJson),
        };

        private static List<string> SafeDeserializeList(string? jsonOrCsv)
        {
            if (string.IsNullOrWhiteSpace(jsonOrCsv)) return new();
            try
            {
                if (jsonOrCsv.TrimStart().StartsWith("["))
                    return System.Text.Json.JsonSerializer.Deserialize<List<string>>(jsonOrCsv) ?? new();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[SyncService] Error deserializing JSON list: {ex.Message}");
            }
            
            // Fallback for old comma-separated data migration
            return jsonOrCsv.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                            .Select(s => s.Trim())
                            .ToList();
        }
    }
}
