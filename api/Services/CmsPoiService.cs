using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Services
{
    public class CmsPoiService : ICmsPoiService
    {
        private readonly IPoiRepository _pois;
        private readonly AppDbContext _db;

        public CmsPoiService(IPoiRepository pois, AppDbContext db)
        {
            _pois = pois;
            _db = db;
        }

        public async Task<List<PoiListDto>> GetAllForCmsAsync(bool? isActive = null)
        {
            var pois = await _pois.GetAllForCmsAsync(isActive);
            var poiIds = pois.Select(p => p.PoiId).ToList();

            var categoryMap = await (
                from cp in _db.CategoryPois
                join c in _db.Categories on cp.CategoryId equals c.CategoryId
                where poiIds.Contains(cp.PoiId)
                group c by cp.PoiId into g
                select new
                {
                    PoiId = g.Key,
                    Category = g.Select(x => x.Name).FirstOrDefault()
                }
            ).ToDictionaryAsync(x => x.PoiId, x => x.Category);

            var result = pois.Select(p => new PoiListDto
            {
                PoiId = p.PoiId,
                Name = p.Contents.FirstOrDefault(c => c.IsMaster)?.Title ?? "Chưa có tên",
                AccountId = p.AccountId,
                Latitude = p.Latitude,
                Longitude = p.Longitude,
                ActivationRadius = p.ActivationRadius,
                Priority = p.Priority,
                LogoUrl = p.LogoUrl,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                Category = categoryMap.GetValueOrDefault(p.PoiId, "Unknown")
            }).ToList();

            return result;
        }

        public async Task<object?> GetPoiDetailForCmsAsync(string poiId)
        {
            var poi = await _db.Pois.AsNoTracking()
                .Include(p => p.Contents)
                .Include(p => p.Gallery)
                .FirstOrDefaultAsync(p => p.PoiId == poiId);

            if (poi is null) return null;

            var category = await (
                from cp in _db.CategoryPois
                join c in _db.Categories on cp.CategoryId equals c.CategoryId
                where cp.PoiId == poiId
                select c.Name
            ).FirstOrDefaultAsync();

            return new
            {
                poiId = poi.PoiId,
                accountId = poi.AccountId,
                latitude = poi.Latitude,
                longitude = poi.Longitude,
                activationRadius = poi.ActivationRadius,
                priority = poi.Priority,
                isActive = poi.IsActive,
                logoUrl = poi.LogoUrl,
                createdAt = poi.CreatedAt,
                updatedAt = poi.UpdatedAt,
                category = category ?? "Unknown",
                contents = poi.Contents.Select(c => new
                {
                    contentId = c.ContentId,
                    poiId = c.PoiId,
                    languageCode = c.LanguageCode,
                    title = c.Title,
                    description = c.Description,
                    audioUrl = c.AudioUrl,
                    isMaster = c.IsMaster
                }).ToList(),
                gallery = poi.Gallery.OrderBy(g => g.SortOrder)
                    .Select(g => new
                    {
                        imageId = g.ImageId,
                        poiId = g.PoiId,
                        imageUrl = g.ImageUrl,
                        sortOrder = g.SortOrder
                    }).ToList()
            };
        }
    }
}
