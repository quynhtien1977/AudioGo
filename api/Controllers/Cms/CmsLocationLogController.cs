using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Services.Interfaces;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/location-logs")]
    [Authorize]
    public class LocationLogController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IDevicePresenceService _presence;

        public LocationLogController(AppDbContext context, IDevicePresenceService presence)
        {
            _context = context;
            _presence = presence;
        }

        // ================================
        // ⚡ ONLINE-NOW (in-memory — real-time, no DB)
        // ================================
        [HttpGet("online-now")]
        public IActionResult GetOnlineNow()
        {
            return Ok(new
            {
                onlineNow = _presence.OnlineCount,
                deviceIds = _presence.GetOnlineDeviceIds(),
                snapshotAt = DateTime.UtcNow
            });
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

            var logs = _context.LocationLogs.AsNoTracking();

            // ✅ EF Core-compatible: correlated NOT EXISTS subquery
            // Lấy record mới nhất per device: giữ lại row L nếu không có row nào
            // của cùng DeviceId có Timestamp lớn hơn.
            var latestPerDevice = logs.Where(l =>
                !logs.Any(other =>
                    other.DeviceId  == l.DeviceId &&
                    other.Timestamp >  l.Timestamp
                )
            );

            var totalCount = await latestPerDevice.CountAsync();

            var data = await latestPerDevice
                .OrderByDescending(x => x.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new
                {
                    locationId = x.LocationId,
                    deviceId   = x.DeviceId,
                    latitude   = x.Latitude,
                    longitude  = x.Longitude,
                    timestamp  = x.Timestamp,
                    isOnline   = x.Timestamp >= onlineThreshold
                })
                .ToListAsync();

            return Ok(new { data, totalCount });
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
            var year  = new DateTime(now.Year, 1, 1);

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

            return Ok(new
            {
                // ✅ online = in-memory (instant, no DB query)
                online = _presence.OnlineCount,
                today  = todayCount,
                month  = monthCount,
                year   = yearCount
            });
        }
    }
}