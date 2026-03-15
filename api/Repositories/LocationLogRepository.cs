using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories
{
    public class LocationLogRepository : ILocationLogRepository
    {
        private readonly AppDbContext _db;
        public LocationLogRepository(AppDbContext db) => _db = db;

        public async Task CreateBatchAsync(IEnumerable<LocationLog> logs)
        {
            _db.LocationLogs.AddRange(logs);
            await _db.SaveChangesAsync();
        }

        public Task<List<LocationLog>> GetByDeviceAsync(string deviceId, int limit = 200) =>
            _db.LocationLogs.AsNoTracking()
                .Where(l => l.DeviceId == deviceId)
                .OrderByDescending(l => l.Timestamp)
                .Take(limit)
                .ToListAsync();

        /// <summary>Nhóm logs theo ô lưới 0.001 độ (~100m) để tạo heatmap.</summary>
        public async Task<List<(double Lat, double Lon, int Count)>> GetHeatmapAsync()
        {
            return await _db.LocationLogs.AsNoTracking()
                .GroupBy(l => new
                {
                    Lat = Math.Round(l.Latitude,  3),
                    Lon = Math.Round(l.Longitude, 3)
                })
                .Select(g => new { g.Key.Lat, g.Key.Lon, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Select(x => ValueTuple.Create(x.Lat, x.Lon, x.Count))
                .ToListAsync();
        }
    }
}
