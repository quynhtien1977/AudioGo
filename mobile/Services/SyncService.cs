using AudioGo.Data;
using AudioGo.Helpers;
using AudioGo.Models;
using AudioGo.Services.Interfaces;
using Shared;
using Shared.DTOs;
using System.Text.Json;

namespace AudioGo.Services
{
    public class SyncService : IDisposable
    {
        private readonly IApiService _api;
        private readonly AppDatabase _db;
        private readonly IHttpClientFactory _httpFactory;
        private DateTime _lastPolicyNoticeUtc = DateTime.MinValue;

        private static readonly SemaphoreSlim GallerySemaphore = new(3, 3);

        public event EventHandler<string>? SyncNotice;
        public event EventHandler<string>? LanguageChanged;

        public void NotifyLanguageChanged(string languageCode)
        {
            var normalized = LanguageHelper.NormalizeToSupported(languageCode);
            MainThread.BeginInvokeOnMainThread(() => LanguageChanged?.Invoke(this, normalized));
        }

        public SyncService(IApiService api, AppDatabase db, IHttpClientFactory httpFactory)
        {
            _api = api;
            _db = db;
            _httpFactory = httpFactory;

            Connectivity.ConnectivityChanged += OnConnectivityChanged;
        }

        private void OnConnectivityChanged(object? sender, ConnectivityChangedEventArgs e)
        {
            if (e.NetworkAccess != NetworkAccess.Internet &&
                e.NetworkAccess != NetworkAccess.ConstrainedInternet)
            {
                return;
            }

            if (CanDownloadAssetsNow())
                _ = Task.Run(() => RetryPendingDownloadsAsync());
            else
                PublishNotice("Đang chờ wifi tải nền. Bạn có thể dùng dữ liệu di động trong cài đặt.");
        }

        public void Dispose()
        {
            Connectivity.ConnectivityChanged -= OnConnectivityChanged;
        }

        public async Task<List<POI>?> SwitchLanguageAsync(string languageCode, CancellationToken ct = default)
        {
            var normalizedLang = LanguageHelper.NormalizeToSupported(languageCode);

            if (!NetworkHelper.HasInternet())
            {
                PublishNotice("Khong co mang Internet. Vui long ket noi Wi-Fi de cap nhat ngon ngu.");
                return null;
            }

            if (!IsWifiConnection())
            {
                PublishNotice("Can su dung Wi-Fi de cap nhat ngon ngu moi.");
                return null;
            }

            List<POI> serverPois;
            try
            {
                serverPois = await _api.GetPoisAsync(languageCode: normalizedLang, ct: ct);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[SyncService] SwitchLanguage fetch failed: {ex.Message}");
                PublishNotice("Không thể cập nhật ngôn ngữ. Dữ liệu hiện tại được giữ nguyên.");
                return null;
            }

            if (serverPois.Count == 0)
            {
                PublishNotice("Không có dữ liệu ngôn ngữ mới. Dữ liệu hiện tại được giữ nguyên.");
                return null;
            }

            await ReplaceMetadataAsync(serverPois);

            _ = Task.Run(async () =>
            {
                try
                {
                    await DownloadAllAssetsAsync(serverPois, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[SyncService] SwitchLanguage background download error: {ex.Message}");
                }
            });

            return (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();
        }

        public async Task RetryPendingDownloadsAsync(CancellationToken ct = default)
        {
            try
            {
                if (!CanDownloadAssetsNow())
                
                {
                    PublishNotice("Đang dùng dữ liệu di động, chỉ tải ngầm khi có Wifi.");
                    return;
                }

                var allEntities = await _db.GetAllPoisAsync();
                var pending = allEntities
                    .Where(HasPendingAssets)
                    .Select(MapToDto)
                    .ToList();

                if (pending.Count == 0) return;

                await DownloadAllAssetsAsync(pending, ct);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[SyncService] RetryPending error: {ex.Message}");
            }
        }

        public async Task<List<POI>> GetPoisAsync(string languageCode = "vi", CancellationToken ct = default)
        {
            var normalizedLang = LanguageHelper.NormalizeToSupported(languageCode);
            var cached = (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();

            if (cached.Count > 0)
            {
                if (NetworkHelper.HasInternet())
                {
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await RefreshFromServerAsync(normalizedLang, CancellationToken.None);
                        }
                        catch (Exception ex)
                        {
                            System.Diagnostics.Debug.WriteLine($"[SyncService] Background refresh error: {ex.Message}");
                        }
                    });
                }

                return cached;
            }

            if (!NetworkHelper.HasInternet())
                return cached;

            try
            {
                var serverPois = await _api.GetPoisAsync(languageCode: normalizedLang, ct: ct);
                if (serverPois.Count == 0)
                    return cached;

                await ReplaceMetadataAsync(serverPois);

                if (CanDownloadAssetsNow())
                    _ = Task.Run(() => DownloadAllAssetsAsync(serverPois, CancellationToken.None));
                else
                    PublishNotice("Đã đồng bộ nội dung text. Audio/ảnh sẽ tải khi có Wi-Fi.");

                return (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[SyncService] GetPoisAsync server fetch failed: {ex.Message}");
                return cached;
            }
        }

        public async Task<List<POI>> GetPoisWithRefreshAsync(
            string languageCode,
            Func<List<POI>, Task> onRefreshed,
            Action<POI>? onSingleAudioReady = null,
            CancellationToken ct = default)
        {
            var normalizedLang = LanguageHelper.NormalizeToSupported(languageCode);
            var cached = (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();

            if (cached.Count > 0)
            {
                if (NetworkHelper.HasInternet())
                {
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            var fresh = await RefreshFromServerAsync(
                                normalizedLang,
                                CancellationToken.None,
                                onSingleAudioReady);
                            await MainThread.InvokeOnMainThreadAsync(() => onRefreshed(fresh));
                        }
                        catch (Exception ex)
                        {
                            System.Diagnostics.Debug.WriteLine($"[SyncService] GetPoisWithRefreshAsync background error: {ex.Message}");
                        }
                    });
                }

                return cached;
            }

            if (!NetworkHelper.HasInternet())
                return cached;

            try
            {
                var serverPois = await _api.GetPoisAsync(languageCode: normalizedLang, ct: ct);
                if (serverPois.Count == 0)
                    return cached;

                await ReplaceMetadataAsync(serverPois);

                if (CanDownloadAssetsNow())
                {
                    _ = Task.Run(async () =>
                    {
                        await DownloadAllAssetsAsync(serverPois, CancellationToken.None, onSingleAudioReady);
                    });
                }
                else
                {
                    PublishNotice("Đã đồng bộ nội dung text. Audio/ảnh sẽ tải khi có Wi-Fi.");
                }

                return (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[SyncService] GetPoisWithRefreshAsync first-run error: {ex.Message}");
                return cached;
            }
        }

        public async Task<List<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
        {
            if (NetworkHelper.HasInternet())
            {
                try
                {
                    var apiCategories = await _api.GetCategoriesAsync(ct);
                    if (apiCategories.Count > 0) return apiCategories;
                }
                catch
                {
                    // fallback to local cache
                }
            }

            var cachedPois = await _db.GetAllPoisAsync();
            return cachedPois
                .Where(p => !string.IsNullOrEmpty(p.CategoriesJson))
                .SelectMany(p => SafeDeserializeList(p.CategoriesJson))
                .Distinct()
                .Select(cName => new CategoryDto("", cName, 0, DateTime.MinValue, DateTime.MinValue))
                .ToList();
        }

        private async Task<List<POI>> RefreshFromServerAsync(
            string normalizedLang,
            CancellationToken ct,
            Action<POI>? onSingleAudioReady = null)
        {
            var serverPois = await _api.GetPoisAsync(languageCode: normalizedLang, ct: ct);
            if (serverPois.Count == 0)
                return (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();

            await ReplaceMetadataAsync(serverPois);

            if (CanDownloadAssetsNow())
            {
                await DownloadAllAssetsAsync(serverPois, CancellationToken.None, onSingleAudioReady);
            }
            else
            {
                PublishNotice("Đang chờ Wi-Fi để tải âm thanh/ảnh. Bạn có thể bật dữ liệu di động nếu muốn tải ngay.");
            }

            return (await _db.GetAllPoisAsync()).Select(MapToDto).ToList();
        }

        private async Task ReplaceMetadataAsync(List<POI> pois)
        {
            var allExisting = await _db.GetAllPoisAsync();
            var existingMap = allExisting.ToDictionary(e => e.PoiId);
            var incomingIds = new HashSet<string>(pois.Select(p => p.PoiId));

            foreach (var poi in pois)
            {
                var entity = MapToEntity(poi);

                if (existingMap.TryGetValue(poi.PoiId, out var existing))
                {
                    entity.LocalAudioPath = PreserveAudioFile(existing, poi.AudioUrl);
                    entity.LocalLogoPath = PreserveLogoFile(existing, poi.LogoUrl);
                    entity.GalleryLocalPathsJson = PreserveGalleryFiles(existing, entity.GalleryUrlsJson);
                }

                await _db.SavePoiAsync(entity);
            }

            foreach (var stale in allExisting.Where(e => !incomingIds.Contains(e.PoiId)))
            {
                DeletePoiMediaFiles(stale);
                await _db.DeletePoiAsync(stale);
            }
        }

        private static string? PreserveAudioFile(PoiEntity existing, string? newAudioUrl)
        {
            if (string.IsNullOrEmpty(existing.LocalAudioPath) ||
                !File.Exists(existing.LocalAudioPath))
            {
                return null;
            }

            if (string.Equals(existing.AudioUrl, newAudioUrl, StringComparison.OrdinalIgnoreCase))
                return existing.LocalAudioPath;

            TryDeleteFile(existing.LocalAudioPath);
            return null;
        }

        private static string? PreserveLogoFile(PoiEntity existing, string? newLogoUrl)
        {
            if (string.IsNullOrEmpty(existing.LocalLogoPath) ||
                !File.Exists(existing.LocalLogoPath))
            {
                return null;
            }

            if (string.Equals(existing.LogoUrl, newLogoUrl, StringComparison.OrdinalIgnoreCase))
                return existing.LocalLogoPath;

            TryDeleteFile(existing.LocalLogoPath);
            return null;
        }

        private static string? PreserveGalleryFiles(PoiEntity existing, string newGalleryUrlsJson)
        {
            if (string.IsNullOrEmpty(existing.GalleryLocalPathsJson))
                return null;

            if (string.Equals(existing.GalleryUrlsJson, newGalleryUrlsJson, StringComparison.Ordinal))
                return existing.GalleryLocalPathsJson;

            DeleteGalleryFilesFromJson(existing.GalleryLocalPathsJson);
            return null;
        }

        private static void DeletePoiMediaFiles(PoiEntity poi)
        {
            if (!string.IsNullOrEmpty(poi.LocalAudioPath))
                TryDeleteFile(poi.LocalAudioPath);

            if (!string.IsNullOrEmpty(poi.LocalLogoPath))
                TryDeleteFile(poi.LocalLogoPath);

            DeleteGalleryFilesFromJson(poi.GalleryLocalPathsJson);
        }

        private static void DeleteGalleryFilesFromJson(string? galleryLocalPathsJson)
        {
            foreach (var path in SafeDeserializeList(galleryLocalPathsJson))
                TryDeleteFile(path);
        }

        private static void TryDeleteFile(string? path)
        {
            if (string.IsNullOrWhiteSpace(path)) return;
            try
            {
                if (File.Exists(path))
                    File.Delete(path);
            }
            catch
            {
                // best-effort cleanup only
            }
        }

        private bool HasPendingAssets(PoiEntity e)
        {
            var missingAudio = !string.IsNullOrEmpty(e.AudioUrl) &&
                               (string.IsNullOrEmpty(e.LocalAudioPath) || !File.Exists(e.LocalAudioPath));

            var missingLogo = !string.IsNullOrEmpty(e.LogoUrl) &&
                              (string.IsNullOrEmpty(e.LocalLogoPath) || !File.Exists(e.LocalLogoPath));

            var missingGallery = HasMissingGalleryFiles(e);

            return missingAudio || missingLogo || missingGallery;
        }

        private static bool HasMissingGalleryFiles(PoiEntity e)
        {
            var urls = SafeDeserializeList(e.GalleryUrlsJson);
            if (urls.Count == 0) return false;

            var locals = SafeDeserializeList(e.GalleryLocalPathsJson);
            if (locals.Count != urls.Count) return true;

            return locals.Any(path => !File.Exists(path));
        }

        private async Task DownloadAllAssetsAsync(
            List<POI> pois,
            CancellationToken ct,
            Action<POI>? onSingleAudioReady = null)
        {
            await DownloadAudioFilesAsync(pois, ct, onSingleAudioReady);
            await DownloadImageFilesAsync(pois, ct);
            await DownloadGalleryFilesAsync(pois, ct);
        }

        private async Task DownloadAudioFilesAsync(List<POI> pois, CancellationToken ct, Action<POI>? onSingleAudioReady = null)
        {
            var audioDir = Path.Combine(FileSystem.AppDataDirectory, "audio");
            Directory.CreateDirectory(audioDir);

            using var http = _httpFactory.CreateClient("downloader");

            foreach (var poi in pois)
            {
                if (ct.IsCancellationRequested) break;
                if (string.IsNullOrEmpty(poi.AudioUrl)) continue;

                try
                {
                    var existing = await _db.GetPoiAsync(poi.PoiId);

                    if (existing is not null &&
                        !string.IsNullOrEmpty(existing.LocalAudioPath) &&
                        File.Exists(existing.LocalAudioPath) &&
                        string.Equals(existing.AudioUrl, poi.AudioUrl, StringComparison.OrdinalIgnoreCase))
                    {
                        poi.LocalAudioPath = existing.LocalAudioPath;
                        continue;
                    }

                    var fileName = $"{poi.PoiId}_{LanguageHelper.NormalizeToSupported(poi.LanguageCode)}.mp3";
                    var localPath = Path.Combine(audioDir, fileName);

                    var bytes = await http.GetByteArrayAsync(poi.AudioUrl, ct);
                    await File.WriteAllBytesAsync(localPath, bytes, ct);

                    if (existing is not null)
                    {
                        existing.LocalAudioPath = localPath;
                        existing.AudioUrl = poi.AudioUrl;
                        await _db.SavePoiAsync(existing);
                    }

                    poi.LocalAudioPath = localPath;
                    if (onSingleAudioReady is not null)
                        MainThread.BeginInvokeOnMainThread(() => onSingleAudioReady(poi));
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[SyncService] Download audio failed for {poi.PoiId}: {ex.Message}");
                }
            }
        }

        private async Task DownloadImageFilesAsync(List<POI> pois, CancellationToken ct)
        {
            var imagesDir = Path.Combine(FileSystem.AppDataDirectory, "images");
            Directory.CreateDirectory(imagesDir);

            using var http = _httpFactory.CreateClient("downloader");

            foreach (var poi in pois)
            {
                if (ct.IsCancellationRequested) break;
                if (string.IsNullOrEmpty(poi.LogoUrl)) continue;

                try
                {
                    var existing = await _db.GetPoiAsync(poi.PoiId);

                    if (existing is not null &&
                        !string.IsNullOrEmpty(existing.LocalLogoPath) &&
                        File.Exists(existing.LocalLogoPath) &&
                        string.Equals(existing.LogoUrl, poi.LogoUrl, StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    string extension = ".png";
                    try
                    {
                        var ext = Path.GetExtension(new Uri(poi.LogoUrl).LocalPath);
                        if (!string.IsNullOrEmpty(ext)) extension = ext;
                    }
                    catch
                    {
                        // keep default extension
                    }

                    var fileName = $"{poi.PoiId}_logo{extension}";
                    var localPath = Path.Combine(imagesDir, fileName);

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
                    System.Diagnostics.Debug.WriteLine($"[SyncService] Download logo failed for {poi.PoiId}: {ex.Message}");
                }
            }
        }

        private async Task DownloadGalleryFilesAsync(List<POI> pois, CancellationToken ct)
        {
            var galleryDir = Path.Combine(FileSystem.AppDataDirectory, "gallery");
            Directory.CreateDirectory(galleryDir);

            using var http = _httpFactory.CreateClient("downloader");

            var tasks = pois
                .Where(p => p.GalleryUrls is { Count: > 0 })
                .Select(poi => DownloadGalleryForPoiAsync(poi, galleryDir, http, ct))
                .ToList();

            await Task.WhenAll(tasks);
        }

        private async Task DownloadGalleryForPoiAsync(POI poi, string galleryDir, HttpClient http, CancellationToken ct)
        {
            if (ct.IsCancellationRequested || poi.GalleryUrls is not { Count: > 0 })
                return;

            try
            {
                var existing = await _db.GetPoiAsync(poi.PoiId);
                var localPaths = new List<string>();

                for (int i = 0; i < poi.GalleryUrls.Count; i++)
                {
                    if (ct.IsCancellationRequested) break;

                    var url = poi.GalleryUrls[i];
                    if (string.IsNullOrWhiteSpace(url)) continue;

                    string extension = ".jpg";
                    try
                    {
                        var ext = Path.GetExtension(new Uri(url).LocalPath);
                        if (!string.IsNullOrWhiteSpace(ext) && ext != ".") extension = ext;
                    }
                    catch
                    {
                        // keep default extension
                    }

                    var fileName = $"{poi.PoiId}_gallery_{i}{extension}";
                    var localPath = Path.Combine(galleryDir, fileName);
                    localPaths.Add(localPath);

                    if (File.Exists(localPath)) continue;

                    await GallerySemaphore.WaitAsync(ct);
                    try
                    {
                        var bytes = await http.GetByteArrayAsync(url, ct);
                        await File.WriteAllBytesAsync(localPath, bytes, ct);
                    }
                    finally
                    {
                        GallerySemaphore.Release();
                    }
                }

                if (existing is not null)
                {
                    var localJson = JsonSerializer.Serialize(localPaths);
                    if (!string.Equals(existing.GalleryLocalPathsJson, localJson, StringComparison.Ordinal))
                    {
                        existing.GalleryLocalPathsJson = localJson;
                        await _db.SavePoiAsync(existing);
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[SyncService] Download gallery failed for {poi.PoiId}: {ex.Message}");
            }
        }

        private static PoiEntity MapToEntity(POI dto)
        {
            var lang = LanguageHelper.NormalizeToSupported(dto.LanguageCode);
            return new PoiEntity
            {
                PoiId = dto.PoiId,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                ActivationRadius = dto.ActivationRadius,
                Priority = dto.Priority,
                IsActive = dto.IsActive,
                LogoUrl = dto.LogoUrl,
                LocalLogoPath = dto.LocalLogoPath,
                LanguageCode = lang,
                Title = dto.Title ?? string.Empty,
                Description = dto.Description ?? string.Empty,
                AudioUrl = dto.AudioUrl,
                LocalAudioPath = dto.LocalAudioPath,
                CategoriesJson = dto.Categories?.Count > 0
                    ? JsonSerializer.Serialize(dto.Categories)
                    : string.Empty,
                GalleryUrlsJson = dto.GalleryUrls?.Count > 0
                    ? JsonSerializer.Serialize(dto.GalleryUrls)
                    : string.Empty,
                LastSyncedAt = DateTime.UtcNow
            };
        }

        private static POI MapToDto(PoiEntity e) => new()
        {
            PoiId = e.PoiId,
            Latitude = e.Latitude,
            Longitude = e.Longitude,
            ActivationRadius = e.ActivationRadius,
            Priority = e.Priority,
            IsActive = e.IsActive,
            LogoUrl = e.LogoUrl,
            LocalLogoPath = e.LocalLogoPath,
            LanguageCode = e.LanguageCode ?? "vi",
            Title = e.Title ?? string.Empty,
            Description = e.Description ?? string.Empty,
            AudioUrl = e.AudioUrl,
            LocalAudioPath = e.LocalAudioPath,
            Categories = SafeDeserializeList(e.CategoriesJson),
            GalleryUrls = SafeDeserializeList(e.GalleryUrlsJson),
        };

        private void PublishNotice(string message)
        {
            var now = DateTime.UtcNow;
            if ((now - _lastPolicyNoticeUtc) < TimeSpan.FromSeconds(20)) return;
            _lastPolicyNoticeUtc = now;

            System.Diagnostics.Debug.WriteLine($"[SyncService] Notice: {message}");
            MainThread.BeginInvokeOnMainThread(() => 
            {
                SyncNotice?.Invoke(this, message);
                CommunityToolkit.Maui.Alerts.Toast.Make(message, CommunityToolkit.Maui.Core.ToastDuration.Long, 14).Show();
            });
        }

        private static bool IsWifiConnection()
        {
            try
            {
                var profiles = Connectivity.Current.ConnectionProfiles;
                return profiles.Contains(ConnectionProfile.WiFi) ||
                       profiles.Contains(ConnectionProfile.Ethernet);
            }
            catch
            {
                return false;
            }
        }

        private bool CanDownloadAssetsNow()
        {
            if (!NetworkHelper.HasInternet()) return false;
            if (AppSettings.IsCellularDownloadsAllowed()) return true;
            return IsWifiConnection();
        }

        private static List<string> SafeDeserializeList(string? jsonOrCsv)
        {
            if (string.IsNullOrWhiteSpace(jsonOrCsv)) return new();
            try
            {
                if (jsonOrCsv.TrimStart().StartsWith("["))
                    return JsonSerializer.Deserialize<List<string>>(jsonOrCsv) ?? new();
            }
            catch
            {
                // fallback to CSV
            }

            return jsonOrCsv.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                            .Select(s => s.Trim())
                            .ToList();
        }
    }
}
