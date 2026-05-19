using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;
using Shared.DTOs;

namespace Server.Repositories
{
    public class ListenHistoryRepository : IListenHistoryRepository
    {
        private readonly AppDbContext _db;
        public ListenHistoryRepository(AppDbContext db) => _db = db;

        public async Task<ListenHistory> CreateAsync(ListenHistory entry)
        {
            _db.ListenHistories.Add(entry);
            await _db.SaveChangesAsync();
            return entry;
        }

        public async Task CreateBatchAsync(IEnumerable<ListenHistory> entries)
        {
            _db.ListenHistories.AddRange(entries);
            await _db.SaveChangesAsync();
        }

        public Task<List<ListenHistory>> GetByPoiAsync(string poiId, int limit = 100) =>
            _db.ListenHistories.AsNoTracking()
                .Where(lh => lh.PoiId == poiId)
                .OrderByDescending(lh => lh.Timestamp)
                .Take(limit)
                .ToListAsync();

        public async Task<List<(string PoiId, int Count)>> GetTopPoisAsync(int topN = 10)
        {
            return await _db.ListenHistories.AsNoTracking()
                .GroupBy(lh => lh.PoiId)
                .Select(g => new { PoiId = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(topN)
                .Select(x => ValueTuple.Create(x.PoiId, x.Count))
                .ToListAsync();
        }

        /// <inheritdoc/>
        public async Task<List<ListenHistoryItemDto>> GetByDeviceAsync(
            string deviceId, string lang = "vi", int limit = 5)
        {
            // 1. Lấy record mới nhất (Timestamp, TotalDuration) cho mỗi PoiId của device
            var grouped = await _db.ListenHistories.AsNoTracking()
                .Where(lh => lh.DeviceId == deviceId)
                .GroupBy(lh => lh.PoiId)
                .Select(g => new
                {
                    PoiId             = g.Key,
                    LastListenedAt    = g.Max(x => x.Timestamp),
                    TotalListenDuration = g.Sum(x => x.ListenDuration)
                })
                .OrderByDescending(x => x.LastListenedAt)
                .Take(limit)
                .ToListAsync();

            if (grouped.Count == 0)
                return new List<ListenHistoryItemDto>();

            var poiIds = grouped.Select(x => x.PoiId).ToList();

            // 2. Load POI data (LogoUrl) + localized title theo lang
            var pois = await _db.Pois.AsNoTracking()
                .Where(p => poiIds.Contains(p.PoiId) && p.IsActive)
                .Include(p => p.Contents)
                .ToListAsync();

            // 3. Map sang DTO — giữ thứ tự theo LastListenedAt
            var poiMap = pois.ToDictionary(p => p.PoiId);
            var result = new List<ListenHistoryItemDto>();

            foreach (var g in grouped)
            {
                if (!poiMap.TryGetValue(g.PoiId, out var poi)) continue;

                // Ưu tiên ngôn ngữ yêu cầu → fallback vi → bất kỳ content nào
                var content = poi.Contents.FirstOrDefault(c => c.LanguageCode == lang)
                           ?? poi.Contents.FirstOrDefault(c => c.LanguageCode == "vi")
                           ?? poi.Contents.FirstOrDefault();

                result.Add(new ListenHistoryItemDto
                {
                    PoiId               = g.PoiId,
                    Title               = content?.Title ?? g.PoiId,
                    LogoUrl             = poi.LogoUrl,
                    LastListenedAt      = g.LastListenedAt,
                    TotalListenDuration = g.TotalListenDuration
                });
            }

            return result;
        }

        public async Task<int> GetTotalListensAsync()
        {
            return await _db.ListenHistories.CountAsync();
        }

        // cho chart
        public async Task<List<DailyListenDto>> GetDailyListensAsync(int? days = null)
        {
            var query = _db.ListenHistories.AsNoTracking();

            if (days.HasValue)
            {
                var fromDate = DateTime.Now.AddDays(-days.Value);
                query = query.Where(x => x.Timestamp >= fromDate);
            }

            return await query
                .GroupBy(x => x.Timestamp.Date)
                .Select(g => new DailyListenDto
                {
                    Date = g.Key,
                    Count = g.Count(),
                    TotalDuration = g.Sum(x => x.ListenDuration)
                })
                .OrderBy(x => x.Date)
                .ToListAsync();
            
        }
    }
}
