using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories
{
    public class PoiRepository : IPoiRepository
    {
        private readonly AppDbContext _db;
        public PoiRepository(AppDbContext db) => _db = db;

        public Task<List<Poi>> GetAllAsync() =>
            _db.Pois.AsNoTracking()
                .Where(p => p.IsActive)
                .Include(p => p.Contents)
                .Include(p => p.Gallery)
                .Include(p => p.CategoryPois)
                    .ThenInclude(cp => cp.Category)
                .OrderBy(p => p.Priority)
                .ToListAsync();

        /// <summary>
        /// Tìm kiếm POI theo từ khóa (title) và/hoặc tên category.
        /// Case-insensitive, chỉ trả về POI active/published.
        /// </summary>
        public async Task<List<Poi>> SearchAsync(string? query, string? category)
        {
            var q = _db.Pois.AsNoTracking()
                .Where(p => p.IsActive)
                .Include(p => p.Contents)
                .Include(p => p.Gallery)
                .Include(p => p.CategoryPois)
                    .ThenInclude(cp => cp.Category)
                .AsQueryable();

            // Filter theo category name
            if (!string.IsNullOrWhiteSpace(category))
                q = q.Where(p => p.CategoryPois
                    .Any(cp => cp.Category != null &&
                               cp.Category.Name.ToLower().Contains(category.ToLower())));

            var pois = await q.OrderBy(p => p.Priority).ToListAsync();

            // Filter theo title trong contents (sau khi load — EF không support full-text trên nvarchar(max) tốt)
            if (!string.IsNullOrWhiteSpace(query))
            {
                var lower = query.ToLower();
                pois = pois.Where(p => p.Contents.Any(c =>
                    c.Title.ToLower().Contains(lower)
                )).ToList();
            }

            return pois;
        }

        public Task<Poi?> GetByIdAsync(string poiId) =>
            _db.Pois.AsNoTracking()
                .Include(p => p.Contents)
                .Include(p => p.Gallery)
                .Include(p => p.CategoryPois)
                    .ThenInclude(cp => cp.Category)
                .FirstOrDefaultAsync(p => p.PoiId == poiId);

        /// <summary>
        /// Haversine filter: lấy POI trong bán kính (metres) từ toạ độ cho trước.
        /// Chỉ trả về POI có IsActive = true.
        /// </summary>
        public async Task<List<Poi>> GetNearbyAsync(double lat, double lon, double radiusMeters)
        {
            const double EarthR = 6_371_000;
            double latRad = lat * Math.PI / 180;

            // Bounding-box candidate filter
            double latDelta = radiusMeters / 111_000;
            double lonDelta = radiusMeters / (111_000 * Math.Cos(latRad));

            var candidates = await _db.Pois.AsNoTracking()
                .Where(p => p.IsActive
                         && p.Latitude  >= lat - latDelta && p.Latitude  <= lat + latDelta
                         && p.Longitude >= lon - lonDelta && p.Longitude <= lon + lonDelta)
                .Include(p => p.Contents)
                .Include(p => p.Gallery)
                .Include(p => p.CategoryPois)
                    .ThenInclude(cp => cp.Category)
                .ToListAsync();

            // Haversine precise filter
            return candidates.Where(p =>
            {
                double dLat = (p.Latitude  - lat) * Math.PI / 180;
                double dLon = (p.Longitude - lon) * Math.PI / 180;
                double a = Math.Sin(dLat/2) * Math.Sin(dLat/2)
                         + Math.Cos(latRad) * Math.Cos(p.Latitude * Math.PI/180)
                         * Math.Sin(dLon/2) * Math.Sin(dLon/2);
                return EarthR * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1-a)) <= radiusMeters;
            }).ToList();
        }

        public async Task<List<Poi>> GetAllForCmsAsync(bool? isActive = null)
        {
            var query = _db.Pois.AsNoTracking()
                .Include(p => p.Contents)
                .Include(p => p.Gallery)
                .Include(p => p.CategoryPois)
                    .ThenInclude(cp => cp.Category)
                .AsQueryable();

            // isActive null → trả hết (CMS cần thấy toàn bộ)
            if (isActive.HasValue)
                query = query.Where(p => p.IsActive == isActive.Value);

            return await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        }


        public async Task<Poi> CreateAsync(Poi poi)
        {
            _db.Pois.Add(poi);
            await _db.SaveChangesAsync();
            return poi;
        }

        public async Task<Poi?> UpdateAsync(Poi poi)
        {
            var existing = await _db.Pois.FindAsync(poi.PoiId);
            if (existing is null) return null;
            _db.Entry(existing).CurrentValues.SetValues(poi);
            existing.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(string poiId)
        {
            var poi = await _db.Pois.FindAsync(poiId);
            if (poi is null) return false;
            _db.Pois.Remove(poi);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
