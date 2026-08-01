using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Text.Json;

namespace Server.Services
{
    /// <summary>
    /// Background service chạy hàng ngày để xóa dữ liệu cũ (auto-purge data retention):
    /// - LocationLog: chỉ giữ lại 30 ngày.
    /// - ListenHistory: chỉ giữ lại 90 ngày.
    ///
    /// Chạy định kỳ vào 3:00 AM ICT (20:00 UTC).
    /// </summary>
    public class DataRetentionService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<DataRetentionService> _logger;

        public DataRetentionService(
            IServiceScopeFactory scopeFactory,
            ILogger<DataRetentionService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DataRetentionService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Chờ đến 3AM ICT (UTC+7) = 20:00 UTC
                    var now = DateTime.UtcNow;
                    var nextRun = now.Date.AddHours(20);
                    if (now >= nextRun)
                    {
                        nextRun = nextRun.AddDays(1);
                    }
                    var delay = nextRun - now;

                    _logger.LogInformation("DataRetentionService: next purge scheduled at {NextRun} UTC (in {DelayHours:F1} hours)", nextRun, delay.TotalHours);
                    await Task.Delay(delay, stoppingToken);

                    await PurgeOldLogsAndHistoryAsync(stoppingToken);
                    await CleanOrphanMediaAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "DataRetentionService encountered an error");
                    // Tránh vòng lặp vô hạn khi xảy ra lỗi liên tục, trì hoãn 1 giờ trước khi thử lại
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }

            _logger.LogInformation("DataRetentionService stopped.");
        }

        private async Task PurgeOldLogsAndHistoryAsync(CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            _logger.LogInformation("DataRetentionService: Starting data purge process...");

            // 1. LocationLog: Giữ 30 ngày (xóa các logs có Timestamp < 30 days ago)
            var cutoffLocation = DateTime.UtcNow.AddDays(-30);
            
            // Xóa trực tiếp dùng ExecuteDeleteAsync (EF Core 7+) để tối ưu hiệu năng vượt trội,
            // tránh load hàng ngàn rows vào memory rồi RemoveRange.
            var deletedLocationLogs = await db.LocationLogs
                .Where(l => l.Timestamp < cutoffLocation)
                .ExecuteDeleteAsync(ct);

            // 2. ListenHistory: Giữ 90 ngày (xóa các history có Timestamp < 90 days ago)
            var cutoffListen = DateTime.UtcNow.AddDays(-90);
            var deletedListenHistories = await db.ListenHistories
                .Where(h => h.Timestamp < cutoffListen)
                .ExecuteDeleteAsync(ct);

            _logger.LogInformation(
                "DataRetentionService: Purge completed. Deleted {LocationCount} old LocationLog rows (cutoff={LocationCutoff}) and {ListenCount} old ListenHistory rows (cutoff={ListenCutoff})",
                deletedLocationLogs, cutoffLocation, deletedListenHistories, cutoffListen);
        }

        private async Task CleanOrphanMediaAsync(CancellationToken ct)
        {
            _logger.LogInformation("DataRetentionService: Starting media garbage collection...");

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var blob = scope.ServiceProvider.GetRequiredService<IBlobStorageService>();

                // 1. Thu thập tất cả các URL đang được sử dụng trong DB (đối với POI đang hoạt động, Tour, Article)
                var activeAudioUrls = await db.PoiContents
                    .Where(c => c.AudioUrl != null && c.AudioUrl != "" && c.Poi != null && c.Poi.DeletedAt == null && c.Poi.IsActive)
                    .Select(c => c.AudioUrl!)
                    .ToListAsync(ct);

                var activeLogoUrls = await db.Pois
                    .Where(p => p.LogoUrl != null && p.LogoUrl != "" && p.DeletedAt == null && p.IsActive)
                    .Select(p => p.LogoUrl!)
                    .ToListAsync(ct);

                var activeGalleryUrls = await db.PoiGalleries
                    .Where(g => g.ImageUrl != null && g.ImageUrl != "" && g.Poi != null && g.Poi.DeletedAt == null && g.Poi.IsActive)
                    .Select(g => g.ImageUrl)
                    .ToListAsync(ct);

                var tourThumbnails = await db.Tours
                    .Where(t => t.ThumbnailUrl != null && t.ThumbnailUrl != "" && t.DeletedAt == null && t.IsActive)
                    .Select(t => t.ThumbnailUrl!)
                    .ToListAsync(ct);

                var articleImages = await db.Articles
                    .Where(a => a.ImageUrl != null && a.ImageUrl != "" && a.DeletedAt == null && a.IsActive)
                    .Select(a => a.ImageUrl!)
                    .ToListAsync(ct);

                var allActiveUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (var url in activeAudioUrls) allActiveUrls.Add(url);
                foreach (var url in activeLogoUrls) allActiveUrls.Add(url);
                foreach (var url in activeGalleryUrls) allActiveUrls.Add(url);
                foreach (var url in tourThumbnails) allActiveUrls.Add(url);
                foreach (var url in articleImages) allActiveUrls.Add(url);

                // 2. Thu thập các URL trong các PoiRequest đang PENDING hoặc mới APPROVED/REJECTED trong vòng 7 ngày
                // (Chúng ta giữ lại các tệp này để có thể xem lại thông tin lịch sử duyệt)
                var recentCutoff = DateTime.UtcNow.AddDays(-7);
                var activeRequests = await db.PoiRequests
                    .Where(r => r.Status == "PENDING" || (r.UpdatedAt ?? r.CreatedAt) >= recentCutoff)
                    .ToListAsync(ct);

                foreach (var req in activeRequests)
                {
                    if (string.IsNullOrEmpty(req.ProposedData)) continue;
                    try
                    {
                        var draft = JsonSerializer.Deserialize<PoiDraftDto>(
                            req.ProposedData, 
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                        );
                        if (draft != null)
                        {
                            if (!string.IsNullOrEmpty(draft.AudioUrl)) allActiveUrls.Add(draft.AudioUrl);
                            if (!string.IsNullOrEmpty(draft.LogoUrl)) allActiveUrls.Add(draft.LogoUrl);
                            if (draft.GalleryImageUrls != null)
                            {
                                foreach (var url in draft.GalleryImageUrls)
                                {
                                    if (!string.IsNullOrEmpty(url)) allActiveUrls.Add(url);
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to parse ProposedData for request ID {RequestId}", req.RequestId);
                    }
                }

                // 3. XỬ LÝ 1: Dọn dẹp REJECTED Requests (Status = REJECTED, MediaCleaned = false, và UpdatedAt < 7 ngày trước)
                var rejectedRequests = await db.PoiRequests
                    .Where(r => r.Status == "REJECTED" && !r.MediaCleaned && (r.UpdatedAt ?? r.CreatedAt) < recentCutoff)
                    .ToListAsync(ct);

                int deletedRejectedMediaCount = 0;
                foreach (var req in rejectedRequests)
                {
                    if (string.IsNullOrEmpty(req.ProposedData)) continue;
                    try
                    {
                        var draft = JsonSerializer.Deserialize<PoiDraftDto>(
                            req.ProposedData, 
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                        );
                        if (draft != null)
                        {
                            // Kiểm tra và xóa AudioUrl
                            if (!string.IsNullOrEmpty(draft.AudioUrl) && !allActiveUrls.Contains(draft.AudioUrl))
                            {
                                _logger.LogInformation("DataRetentionService: Deleting orphan audio {Url} from rejected request {Id}", draft.AudioUrl, req.RequestId);
                                await blob.DeleteBlobByUrlAsync(draft.AudioUrl);
                                deletedRejectedMediaCount++;
                            }

                            // Kiểm tra và xóa LogoUrl
                            if (!string.IsNullOrEmpty(draft.LogoUrl) && !allActiveUrls.Contains(draft.LogoUrl))
                            {
                                _logger.LogInformation("DataRetentionService: Deleting orphan logo {Url} from rejected request {Id}", draft.LogoUrl, req.RequestId);
                                await blob.DeleteBlobByUrlAsync(draft.LogoUrl);
                                deletedRejectedMediaCount++;
                            }

                            // Kiểm tra và xóa các ảnh trong Gallery
                            if (draft.GalleryImageUrls != null)
                            {
                                foreach (var url in draft.GalleryImageUrls)
                                {
                                    if (!string.IsNullOrEmpty(url) && !allActiveUrls.Contains(url))
                                    {
                                        _logger.LogInformation("DataRetentionService: Deleting orphan gallery image {Url} from rejected request {Id}", url, req.RequestId);
                                        await blob.DeleteBlobByUrlAsync(url);
                                        deletedRejectedMediaCount++;
                                    }
                                }
                            }
                        }
                        req.MediaCleaned = true;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to cleanup rejected request ID {RequestId}", req.RequestId);
                    }
                }

                if (rejectedRequests.Any())
                {
                    await db.SaveChangesAsync(ct);
                }

                // 4. XỬ LÝ 2: Dọn dẹp các POI bị soft-deleted quá 30 ngày (DeletedAt != null && DeletedAt < 30 ngày trước)
                var deletedCutoff = DateTime.UtcNow.AddDays(-30);
                var deletedPois = await db.Pois
                    .Include(p => p.Contents)
                    .Include(p => p.Gallery)
                    .Where(p => p.DeletedAt != null && p.DeletedAt < deletedCutoff)
                    .ToListAsync(ct);

                int deletedPoiMediaCount = 0;
                foreach (var poi in deletedPois)
                {
                    // Lấy tất cả URL audio từ Contents
                    foreach (var content in poi.Contents)
                    {
                        if (!string.IsNullOrEmpty(content.AudioUrl) && !allActiveUrls.Contains(content.AudioUrl))
                        {
                            _logger.LogInformation("DataRetentionService: Deleting orphan audio {Url} from soft-deleted POI {Id}", content.AudioUrl, poi.PoiId);
                            await blob.DeleteBlobByUrlAsync(content.AudioUrl);
                            content.AudioUrl = null; // Xóa tham chiếu để tránh DB trỏ đến URL rác
                            deletedPoiMediaCount++;
                        }
                    }

                    // Lấy logo Url của POI
                    if (!string.IsNullOrEmpty(poi.LogoUrl) && !allActiveUrls.Contains(poi.LogoUrl))
                    {
                        _logger.LogInformation("DataRetentionService: Deleting logo {Url} from soft-deleted POI {Id}", poi.LogoUrl, poi.PoiId);
                        await blob.DeleteBlobByUrlAsync(poi.LogoUrl);
                        poi.LogoUrl = null;
                        deletedPoiMediaCount++;
                    }

                    // Lấy tất cả URL ảnh từ Gallery
                    foreach (var gallery in poi.Gallery)
                    {
                        if (!string.IsNullOrEmpty(gallery.ImageUrl) && !allActiveUrls.Contains(gallery.ImageUrl))
                        {
                            _logger.LogInformation("DataRetentionService: Deleting image {Url} from soft-deleted POI gallery {Id}", gallery.ImageUrl, poi.PoiId);
                            await blob.DeleteBlobByUrlAsync(gallery.ImageUrl);
                            deletedPoiMediaCount++;
                        }
                    }

                    // Xóa các bản ghi PoiGallery và PoiContent của POI đó để giải phóng DB
                    db.PoiGalleries.RemoveRange(poi.Gallery);
                    db.PoiContents.RemoveRange(poi.Contents);
                }

                if (deletedPois.Any())
                {
                    await db.SaveChangesAsync(ct);
                }

                _logger.LogInformation(
                    "DataRetentionService: Media GC completed. Cleaned {RejectedCount} files from rejected requests, and {PoiCount} files from soft-deleted POIs (>30d).",
                    deletedRejectedMediaCount, deletedPoiMediaCount
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DataRetentionService: Error occurred during media garbage collection");
            }
        }
    }
}
