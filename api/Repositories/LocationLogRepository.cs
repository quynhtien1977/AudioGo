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
                    Lat = Math.Round(l.Latitude, 3),
                    Lon = Math.Round(l.Longitude, 3)
                })
                .Select(g => new { g.Key.Lat, g.Key.Lon, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Select(x => ValueTuple.Create(x.Lat, x.Lon, x.Count))
                .ToListAsync();
        }

        /// <summary>Heatmap theo thời gian cụ thể (ngày + giờ).</summary>
        /// <param name="date">Ngày (format: yyyy-MM-dd) - nếu null thì lấy tất cả ngày</param>
        /// <param name="hour">Giờ (0-23) - nếu null thì lấy tất cả giờ của ngày</param>
        public async Task<List<(double Lat, double Lon, int Count)>> GetHeatmapByTimeAsync(string? date, int? hour)
        {
            var query = _db.LocationLogs.AsNoTracking();

            // Lọc theo ngày (so sánh Year/Month/Day để tránh timezone issue)
            if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var parsedDate))
            {
                var targetYear = parsedDate.Year;
                var targetMonth = parsedDate.Month;
                var targetDay = parsedDate.Day;
                
                query = query.Where(l => 
                    l.Timestamp.Year == targetYear && 
                    l.Timestamp.Month == targetMonth && 
                    l.Timestamp.Day == targetDay);
            }

            // Lọc theo giờ
            if (hour.HasValue && hour.Value >= 0 && hour.Value < 24)
            {
                query = query.Where(l => l.Timestamp.Hour == hour.Value);
            }

            return await query
                .GroupBy(l => new
                {
                    Lat = Math.Round(l.Latitude, 3),
                    Lon = Math.Round(l.Longitude, 3)
                })
                .Select(g => new { g.Key.Lat, g.Key.Lon, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Select(x => ValueTuple.Create(x.Lat, x.Lon, x.Count))
                .ToListAsync();
        }

        /// <summary>Lấy tất cả location logs với pagination.</summary>
        public async Task<(List<LocationLog> data, int totalCount)> GetAllAsync(int page = 1, int pageSize = 10, string? deviceId = null, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _db.LocationLogs.AsNoTracking();

            if (!string.IsNullOrEmpty(deviceId))
                query = query.Where(l => l.DeviceId == deviceId);

            if (startDate.HasValue)
                query = query.Where(l => l.Timestamp >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(l => l.Timestamp <= endDate.Value);

            var totalCount = await query.CountAsync();
            var data = await query
                .OrderByDescending(l => l.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (data, totalCount);
        }
    }
}
