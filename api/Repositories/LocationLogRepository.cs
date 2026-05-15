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

            DateTime parsedDate = default;
            bool hasDate = !string.IsNullOrEmpty(date) && DateTime.TryParse(date, out parsedDate);
            bool hasHour = hour.HasValue && hour.Value >= 0 && hour.Value < 24;

            if (hasDate && hasHour)
            {
                // Tối ưu SARGable query khi có cả ngày và giờ
                // Giờ Việt Nam (UTC+7), dịch về UTC để so sánh chuẩn với db
                var vnStartTime = new DateTime(parsedDate.Year, parsedDate.Month, parsedDate.Day, hour.Value, 0, 0, DateTimeKind.Unspecified);
                var utcStartTime = vnStartTime.AddHours(-7);
                var utcEndTime = utcStartTime.AddHours(1);

                query = query.Where(l => l.Timestamp >= utcStartTime && l.Timestamp < utcEndTime);
            }
            else if (hasDate)
            {
                // Chỉ có ngày (lấy trọn 1 ngày theo giờ VN)
                var vnStartTime = new DateTime(parsedDate.Year, parsedDate.Month, parsedDate.Day, 0, 0, 0, DateTimeKind.Unspecified);
                var utcStartTime = vnStartTime.AddHours(-7);
                var utcEndTime = utcStartTime.AddDays(1);

                query = query.Where(l => l.Timestamp >= utcStartTime && l.Timestamp < utcEndTime);
            }
            else if (hasHour)
            {
                // Chỉ có giờ nhưng lấy mọi ngày, dùng AddHours để dịch Timestamp DB sang giờ VN
                query = query.Where(l => l.Timestamp.AddHours(7).Hour == hour.Value);
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
