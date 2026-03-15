using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

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
    }
}
