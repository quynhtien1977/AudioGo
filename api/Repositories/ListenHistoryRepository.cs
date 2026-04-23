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
