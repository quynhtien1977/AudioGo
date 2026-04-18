using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/location-logs")]
    [Authorize]
    public class LocationLogController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LocationLogController(AppDbContext context)
        {
            _context = context;
        }

        // ================================
        // 📍 GET DEVICE LIST (LATEST LOG PER DEVICE)
        // ================================
        [HttpGet]
        public async Task<IActionResult> GetLocationLogs(
            int page = 1,
            int pageSize = 10)
        {
            var now = DateTime.UtcNow;
            var onlineThreshold = now.AddMinutes(-5);

            var query = _context.LocationLogs
                                .AsNoTracking();

            // 🔥 GROUP theo device → lấy log mới nhất
            var latestPerDevice = query
                .GroupBy(x => x.DeviceId)
                .Select(g => g
                    .OrderByDescending(x => x.Timestamp)
                    .First()
                );

            var totalCount = await latestPerDevice.CountAsync();

            var data = await latestPerDevice
                .OrderByDescending(x => x.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new
                {
                    locationId = x.LocationId,
                    deviceId = x.DeviceId,
                    latitude = x.Latitude,
                    longitude = x.Longitude,
                    timestamp = x.Timestamp,

                    // 🔥 tính luôn trạng thái online tại BE
                    isOnline = x.Timestamp >= onlineThreshold
                })
                .ToListAsync();

            return Ok(new
            {
                data,
                totalCount
            });
        }

        // ================================
        // 📊 STATS (ONLINE + TODAY + MONTH + YEAR)
        // ================================
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var now = DateTime.UtcNow;

            var today = now.Date;
            var month = new DateTime(now.Year, now.Month, 1);
            var year = new DateTime(now.Year, 1, 1);

            var onlineThreshold = now.AddMinutes(-5);

            var logs = _context.LocationLogs.AsNoTracking();

            var todayCount = await logs
                .Where(x => x.Timestamp >= today)
                .Select(x => x.DeviceId)
                .Distinct()
                .CountAsync();

            var monthCount = await logs
                .Where(x => x.Timestamp >= month)
                .Select(x => x.DeviceId)
                .Distinct()
                .CountAsync();

            var yearCount = await logs
                .Where(x => x.Timestamp >= year)
                .Select(x => x.DeviceId)
                .Distinct()
                .CountAsync();

            var onlineCount = await logs
                .Where(x => x.Timestamp >= onlineThreshold)
                .Select(x => x.DeviceId)
                .Distinct()
                .CountAsync();

            return Ok(new
            {
                online = onlineCount,
                today = todayCount,
                month = monthCount,
                year = yearCount
            });
        }
    }
}