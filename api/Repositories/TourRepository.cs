using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories
{
    public class TourRepository : ITourRepository
    {
        private readonly AppDbContext _db;
        public TourRepository(AppDbContext db) => _db = db;

        private IQueryable<Tour> BaseQuery() =>
            _db.Tours
                .Include(t => t.TourPois.OrderBy(tp => tp.StepOrder))
                    .ThenInclude(tp => tp.Poi);

        /// <summary>
        /// Mobile & CMS list: chỉ trả về tour còn hoạt động (IsActive = true).
        /// </summary>
        public Task<List<Tour>> GetAllAsync() =>
            BaseQuery().AsNoTracking()
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

        /// <summary>
        /// CMS admin: trả về tất cả tour kể cả đã bị ẩn (IsActive = false).
        /// </summary>
        public Task<List<Tour>> GetAllIncludingInactiveAsync() =>
            BaseQuery().AsNoTracking()
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

        /// <summary>Tour detail — cần Poi.Contents và Poi.CategoryPois để build TourStepDto.</summary>
        public Task<Tour?> GetByIdAsync(string tourId) =>
            _db.Tours.AsNoTracking()
                .Include(t => t.TourPois.OrderBy(tp => tp.StepOrder))
                    .ThenInclude(tp => tp.Poi)
                        .ThenInclude(p => p!.Contents)
                .Include(t => t.TourPois.OrderBy(tp => tp.StepOrder))
                    .ThenInclude(tp => tp.Poi)
                        .ThenInclude(p => p!.CategoryPois)
                            .ThenInclude(cp => cp.Category)
                .FirstOrDefaultAsync(t => t.TourId == tourId);

        public async Task<Tour> CreateAsync(Tour tour)
        {
            _db.Tours.Add(tour);
            await _db.SaveChangesAsync();
            return tour;
        }

        public async Task<Tour?> UpdateAsync(Tour tour)
        {
            var existing = await _db.Tours.FindAsync(tour.TourId);
            if (existing is null) return null;
            existing.Name = tour.Name;
            existing.Description = tour.Description;
            existing.ThumbnailUrl = tour.ThumbnailUrl;
            existing.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return existing;
        }

        /// <summary>
        /// Soft-delete: đặt IsActive = false thay vì xóa cứng khỏi DB.
        /// </summary>
        public async Task<bool> DeleteAsync(string tourId)
        {
            var tour = await _db.Tours.FindAsync(tourId);
            if (tour is null) return false;
            tour.IsActive = false;
            tour.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Khôi phục tour đã bị ẩn (IsActive = true).
        /// </summary>
        public async Task<bool> RestoreAsync(string tourId)
        {
            var tour = await _db.Tours.FindAsync(tourId);
            if (tour is null) return false;
            tour.IsActive = true;
            tour.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task AddPoiAsync(string tourId, string poiId, int stepOrder)
        {
            var exists = await _db.TourPois
                .AnyAsync(tp => tp.TourId == tourId && tp.PoiId == poiId);
            if (!exists)
            {
                _db.TourPois.Add(new TourPoi { TourId = tourId, PoiId = poiId, StepOrder = stepOrder });
                await _db.SaveChangesAsync();
            }
        }

        public async Task RemovePoiAsync(string tourId, string poiId)
        {
            var entry = await _db.TourPois
                .FirstOrDefaultAsync(tp => tp.TourId == tourId && tp.PoiId == poiId);
            if (entry is not null)
            {
                _db.TourPois.Remove(entry);
                await _db.SaveChangesAsync();
            }
        }

        public async Task ReorderPoiAsync(string tourId, string poiId, int newOrder)
        {
            var entry = await _db.TourPois
                .FirstOrDefaultAsync(tp => tp.TourId == tourId && tp.PoiId == poiId);
            if (entry is not null)
            {
                entry.StepOrder = newOrder;
                await _db.SaveChangesAsync();
            }
        }
    }
}
