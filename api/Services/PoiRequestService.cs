using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Text.Json;

namespace Server.Services
{
    public class PoiRequestService : IPoiRequestService
    {
        private readonly AppDbContext _db;
        private readonly IPoiRepository _pois;
        private readonly IServiceProvider _serviceProvider;

        public PoiRequestService(AppDbContext db, IPoiRepository pois, IServiceProvider serviceProvider)
        {
            _db = db;
            _pois = pois;
            _serviceProvider = serviceProvider;
        }

        public async Task<List<PoiRequestListDto>> GetMyPoiRequestsAsync(string accountId, string? status = null)
        {
            var query = _db.PoiRequests
                .Where(pr => pr.AccountId == accountId)
                .AsNoTracking();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(pr => pr.Status == status);
            }

            var requests = await query
                .OrderByDescending(pr => pr.CreatedAt)
                .ToListAsync();

            var poiIds = requests.Where(r => r.PoiId != null).Select(r => r.PoiId).Distinct().ToList();
            var poiNames = await _db.PoiContents
                .Where(c => poiIds.Contains(c.PoiId) && c.IsMaster)
                .ToDictionaryAsync(c => c.PoiId, c => c.Title);

            var result = requests.Select(pr => {
                string? poiName = null;
                if (!string.IsNullOrEmpty(pr.ProposedData))
                {
                    try {
                        var doc = JsonDocument.Parse(pr.ProposedData);
                        if (doc.RootElement.TryGetProperty("Title", out var titleProp) || doc.RootElement.TryGetProperty("title", out titleProp))
                        {
                            poiName = titleProp.GetString();
                        }
                    } catch {}
                }
                
                if (string.IsNullOrEmpty(poiName) && pr.PoiId != null && poiNames.TryGetValue(pr.PoiId, out var name))
                {
                    poiName = name;
                }

                return new PoiRequestListDto(
                    pr.RequestId,
                    pr.PoiId,
                    poiName ?? "N/A",
                    pr.AccountId,
                    pr.ActionType,
                    pr.Status,
                    pr.CreatedAt,
                    pr.RejectReason,
                    pr.ProposedData
                );
            }).ToList();

            return result;
        }

        public async Task<object?> GetPoiRequestDetailAsync(string requestId)
        {
            var request = await _db.PoiRequests.AsNoTracking()
                .FirstOrDefaultAsync(r => r.RequestId == requestId);

            if (request is null) return null;

            return new
            {
                requestId = request.RequestId,
                poiId = request.PoiId,
                actionType = request.ActionType,
                proposedData = request.ProposedData,
                rejectReason = request.RejectReason,
                status = request.Status
            };
        }

        public async Task<string> SubmitPoiRequestAsync(string accountId, SubmitPoiRequestDto req)
        {
            if (string.IsNullOrEmpty(req.ActionType))
                throw new ArgumentException("ActionType is required");

            if (req.ActionType != "DELETE" && req.Draft is null)
                throw new ArgumentException("Draft is required for CREATE or UPDATE");

            string? proposedData = null;
            if (req.Draft != null)
            {
                proposedData = JsonSerializer.Serialize(req.Draft);
            }
            else if (req.ActionType?.ToUpper() == "DELETE" && !string.IsNullOrEmpty(req.PoiId))
            {
                // Bug #3: lưu tên POI vào ProposedData để hiển thị sau khi POI bị xóa vật lý
                var poiName = await _db.PoiContents
                    .AsNoTracking()
                    .Where(c => c.PoiId == req.PoiId && c.IsMaster)
                    .Select(c => c.Title)
                    .FirstOrDefaultAsync();

                proposedData = JsonSerializer.Serialize(new { Title = poiName ?? "N/A" });
            }

            var request = new PoiRequest
            {
                RequestId    = Guid.NewGuid().ToString(),
                PoiId        = req.PoiId,
                AccountId    = accountId,
                ActionType   = req.ActionType.ToUpper(),
                Status       = "PENDING",
                ProposedData = proposedData,
                RejectReason = null,
                CreatedAt    = DateTime.UtcNow,
                UpdatedAt    = DateTime.UtcNow
            };

            _db.PoiRequests.Add(request);
            await _db.SaveChangesAsync();

            return request.RequestId;
        }

        public async Task<List<PoiRequestListDto>> GetAllPoiRequestsAsync(string? status = "PENDING")
        {
            var query = _db.PoiRequests.AsNoTracking();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(x => x.Status == status);
            }

            var requests = await query
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            var poiIds = requests.Where(r => r.PoiId != null).Select(r => r.PoiId).Distinct().ToList();
            var poiNames = await _db.PoiContents
                .Where(c => poiIds.Contains(c.PoiId) && c.IsMaster)
                .ToDictionaryAsync(c => c.PoiId, c => c.Title);

            var result = requests.Select(pr => {
                string? poiName = null;
                if (!string.IsNullOrEmpty(pr.ProposedData))
                {
                    try {
                        var doc = JsonDocument.Parse(pr.ProposedData);
                        if (doc.RootElement.TryGetProperty("Title", out var titleProp) || doc.RootElement.TryGetProperty("title", out titleProp))
                        {
                            poiName = titleProp.GetString();
                        }
                    } catch {}
                }
                
                if (string.IsNullOrEmpty(poiName) && pr.PoiId != null && poiNames.TryGetValue(pr.PoiId, out var name))
                {
                    poiName = name;
                }

                return new PoiRequestListDto(
                    pr.RequestId,
                    pr.PoiId,
                    poiName ?? "N/A",
                    pr.AccountId,
                    pr.ActionType,
                    pr.Status,
                    pr.CreatedAt,
                    pr.RejectReason,
                    pr.ProposedData
                );
            }).ToList();

            return result;
        }

        public async Task<object> GetRequestStatsAsync()
        {
            var stats = await _db.PoiRequests
                .Where(x => x.Status == "PENDING")
                .GroupBy(x => x.ActionType)
                .Select(g => new
                {
                    ActionType = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            return new
            {
                newCount    = stats.FirstOrDefault(x => x.ActionType == "CREATE")?.Count ?? 0,
                updateCount = stats.FirstOrDefault(x => x.ActionType == "UPDATE")?.Count ?? 0,
                deleteCount = stats.FirstOrDefault(x => x.ActionType == "DELETE")?.Count ?? 0
            };
        }

        public async Task<ReviewPoiResult> ReviewPoiRequestAsync(string requestId, ReviewPoiRequestDto reviewData)
        {
            var request = await _db.PoiRequests.FirstOrDefaultAsync(r => r.RequestId == requestId);
            if (request is null)
                return new ReviewPoiResult { NotFound = true, Message = "Request not found" };

            if (reviewData.Approved)
            {
                request.Status = "APPROVED";
                request.RejectReason = null;

                try
                {
                    // ===== DELETE =====
                    if (request.ActionType == "DELETE" && request.PoiId != null)
                    {
                        var targetPoiId = request.PoiId;

                        // Soft delete: chỉ set IsActive = false, không xóa record
                        var poi = await _db.Pois.FirstOrDefaultAsync(p => p.PoiId == targetPoiId);
                        if (poi == null)
                        {
                            return new ReviewPoiResult
                            {
                                Success = false,
                                Message = "Không tìm thấy POI để vô hiệu hóa",
                                Detail = $"PoiId={targetPoiId} không tồn tại trong database"
                            };
                        }

                        poi.IsActive = false;
                        poi.UpdatedAt = DateTime.UtcNow;
                        request.UpdatedAt = DateTime.UtcNow;

                        await _db.SaveChangesAsync();

                        return new ReviewPoiResult
                        {
                            Success = true,
                            Message = "Request DELETE approved – POI đã bị vô hiệu hóa",
                            RequestId = requestId,
                            Status = "APPROVED"
                        };
                    }

                    // ===== CREATE / UPDATE =====
                    if (request.ProposedData != null)
                    {
                        var draft = JsonSerializer.Deserialize<PoiDraftDto>(request.ProposedData, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        if (draft != null)
                        {
                            string targetPoiId = request.PoiId ?? Guid.NewGuid().ToString();

                            if (request.ActionType == "CREATE")
                            {
                                var poi = new Poi
                                {
                                    PoiId = targetPoiId,
                                    AccountId = request.AccountId,
                                    Latitude = draft.Latitude,
                                    Longitude = draft.Longitude,
                                    ActivationRadius = draft.ActivationRadius,
                                    Priority = draft.Priority,
                                    LogoUrl = draft.LogoUrl,
                                    IsActive = true,
                                    CreatedAt = DateTime.UtcNow,
                                    UpdatedAt = DateTime.UtcNow
                                };
                                _db.Pois.Add(poi);

                                _db.PoiContents.Add(new PoiContent
                                {
                                    ContentId = Guid.NewGuid().ToString(),
                                    PoiId = targetPoiId,
                                    LanguageCode = "vi",
                                    Title = draft.Title ?? string.Empty,
                                    Description = draft.Description ?? string.Empty,
                                    AudioUrl = draft.AudioUrl,
                                    IsMaster = true
                                });

                                if (draft.CategoryIds != null)
                                {
                                    foreach (var catId in draft.CategoryIds)
                                        _db.CategoryPois.Add(new CategoryPoi { CategoryId = catId, PoiId = targetPoiId });
                                }

                                if (draft.GalleryImageUrls != null)
                                {
                                    var order = 0;
                                    foreach (var img in draft.GalleryImageUrls.Skip(1))
                                        _db.PoiGalleries.Add(new PoiGallery { ImageId = Guid.NewGuid().ToString(), PoiId = targetPoiId, ImageUrl = img, SortOrder = order++ });
                                }

                                request.PoiId = targetPoiId;
                            }
                            else if (request.ActionType == "UPDATE" && request.PoiId != null)
                            {
                                var poi = await _db.Pois.FindAsync(request.PoiId);
                                if (poi != null)
                                {
                                    poi.Latitude = draft.Latitude;
                                    poi.Longitude = draft.Longitude;
                                    poi.ActivationRadius = draft.ActivationRadius;
                                    poi.Priority = draft.Priority;
                                    if (!string.IsNullOrEmpty(draft.LogoUrl)) poi.LogoUrl = draft.LogoUrl;
                                    poi.UpdatedAt = DateTime.UtcNow;

                                    // Update master content – dùng IsMaster thay vì filter LanguageCode
                                    var masterContent = await _db.PoiContents
                                        .FirstOrDefaultAsync(c => c.PoiId == request.PoiId && c.IsMaster);
                                    if (masterContent != null)
                                    {
                                        masterContent.Title = draft.Title ?? masterContent.Title;
                                        masterContent.Description = draft.Description ?? masterContent.Description;
                                        // AudioUrl: null = giữ nguyên; "" = xóa audio; có URL = cập nhật
                                        if (draft.AudioUrl is not null)
                                            masterContent.AudioUrl = string.IsNullOrEmpty(draft.AudioUrl) ? null : draft.AudioUrl;
                                    }

                                    var existingCats = _db.CategoryPois.Where(c => c.PoiId == request.PoiId);
                                    _db.CategoryPois.RemoveRange(existingCats);
                                    if (draft.CategoryIds != null)
                                    {
                                        foreach (var catId in draft.CategoryIds)
                                            _db.CategoryPois.Add(new CategoryPoi { CategoryId = catId, PoiId = request.PoiId });
                                    }

                                    var existingGallery = _db.PoiGalleries.Where(g => g.PoiId == request.PoiId);
                                    _db.PoiGalleries.RemoveRange(existingGallery);
                                    if (draft.GalleryImageUrls != null)
                                    {
                                        var order = 0;
                                        foreach (var img in draft.GalleryImageUrls.Skip(1))
                                            _db.PoiGalleries.Add(new PoiGallery { ImageId = Guid.NewGuid().ToString(), PoiId = request.PoiId, ImageUrl = img, SortOrder = order++ });
                                    }
                                }
                            }

                            await _db.SaveChangesAsync();

                            var localPoiId = targetPoiId;
                            _ = Task.Run(async () =>
                            {
                                using var scope = _serviceProvider.CreateScope();
                                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                                var pipeline = scope.ServiceProvider.GetRequiredService<IContentPipelineService>();

                                var poi = await dbContext.Pois
                                    .Include(p => p.Contents)
                                    .FirstOrDefaultAsync(p => p.PoiId == localPoiId);
                                if (poi == null) return;

                                var master = poi.Contents.FirstOrDefault(c => c.IsMaster);
                                if (master != null)
                                {
                                    try { await pipeline.GenerateAudioAsync(master); } catch { }
                                }

                                var targetLangs = new[] { "en", "fr", "ja", "ko" };
                                foreach (var lang in targetLangs)
                                {
                                    try
                                    {
                                        await pipeline.EnsureContentAsync(poi, lang);
                                        await dbContext.Entry(poi).Collection(p => p.Contents).LoadAsync();
                                    }
                                    catch { }
                                }
                            });
                        }
                    }
                }
                catch (Exception e)
                {
                    return new ReviewPoiResult
                    {
                        Success = false,
                        Message = "Lỗi áp dụng dữ liệu",
                        Detail = e.Message
                    };
                }
            }
            else
            {
                request.Status = "REJECTED";
                request.RejectReason = reviewData.RejectReason;
            }

            request.UpdatedAt = DateTime.UtcNow;
            _db.PoiRequests.Update(request);
            await _db.SaveChangesAsync();

            return new ReviewPoiResult
            {
                Success = true,
                Message = reviewData.Approved ? "Request approved successfully" : "Request rejected successfully",
                RequestId = request.RequestId,
                Status = request.Status
            };
        }
    }
}
