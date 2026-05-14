using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Repositories.Interfaces;
using Shared.DTOs;
using System.Security.Claims;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/analytics")]
    [Authorize]
    public class AnalyticsController : ControllerBase
    {
        private readonly IListenHistoryRepository _history;
        private readonly ILocationLogRepository   _location;
        private readonly AppDbContext _db;

        public AnalyticsController(
            IListenHistoryRepository history,
            ILocationLogRepository location,
            AppDbContext db)
        {
            _history  = history;
            _location = location;
            _db       = db;
        }

        /// <summary>Top N POI được nghe nhiều nhất.</summary>
        // [HttpGet("top-pois")]
        // public async Task<ActionResult<List<TopPoiDto>>> GetTopPois(
        //     [FromQuery] int top = 10)
        // {
        //     var topPois = await _history.GetTopPoisAsync(top);

        //     // 1 query duy nhất lấy tất cả titles — tránh N+1
        //     var poiIds = topPois.Select(tp => tp.PoiId).ToList();
        //     var titles = await _db.PoiContents.AsNoTracking()
        //         .Where(c => poiIds.Contains(c.PoiId) && (c.IsMaster || c.LanguageCode == "vi"))
        //         .GroupBy(c => c.PoiId)
        //         .Select(g => new { PoiId = g.Key, Title = g.First().Title })
        //         .ToDictionaryAsync(x => x.PoiId, x => x.Title);

        //     var result = topPois
        //         .Select(tp => new TopPoiDto(tp.PoiId, titles.GetValueOrDefault(tp.PoiId, tp.PoiId), tp.Count))
        //         .ToList();
        //     return Ok(result);
        // }
        [HttpGet("top-pois")]
        public async Task<ActionResult<List<TopPoiDto>>> GetTopPois([FromQuery] int top = 10)
        {
            var isAdmin = User.IsInRole("Admin");
            var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            List<(string PoiId, int Count)> topPois;
            if (!isAdmin && !string.IsNullOrWhiteSpace(accountId))
            {
                var ownerTopPoisRaw = await (
                    from h in _db.ListenHistories.AsNoTracking()
                    join p in _db.Pois.AsNoTracking() on h.PoiId equals p.PoiId
                    where p.AccountId == accountId
                    group h by h.PoiId into g
                    orderby g.Count() descending
                    select new { PoiId = g.Key, Count = g.Count() }
                )
                .Take(top)
                .ToListAsync();

                topPois = ownerTopPoisRaw
                    .Select(x => (x.PoiId, x.Count))
                    .ToList();
            }
            else
            {
                var historyTopPois = await _history.GetTopPoisAsync(top);
                topPois = historyTopPois.Select(tp => (tp.PoiId, tp.Count)).ToList();
            }

            var poiIds = topPois.Select(tp => tp.PoiId).ToList();

            //  Lấy title 
            var titles = await _db.PoiContents.AsNoTracking()
                .Where(c => poiIds.Contains(c.PoiId) && (c.IsMaster || c.LanguageCode == "vi"))
                .GroupBy(c => c.PoiId)
                .Select(g => new { PoiId = g.Key, Title = g.First().Title })
                .ToDictionaryAsync(x => x.PoiId, x => x.Title);

            // Lấy category
            var categoryMap = await (
                from cp in _db.CategoryPois
                join c in _db.Categories on cp.CategoryId equals c.CategoryId
                where poiIds.Contains(cp.PoiId)
                select new
                {
                    cp.PoiId,
                    Category = c.Name
                }
            )
            .GroupBy(x => x.PoiId)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.First().Category
            );

            //  Merge lại
            var result = topPois.Select(tp =>
            {
                return new TopPoiDto(
                    tp.PoiId,
                    titles.GetValueOrDefault(tp.PoiId, tp.PoiId),
                    tp.Count,
                    categoryMap.GetValueOrDefault(tp.PoiId, "Unknown") // 🔥 FIX CHÍNH
                );
            }).ToList();

            return Ok(result);
        }

        /// <summary>Heatmap vị trí người dùng (nhóm theo ô ~100m).</summary>
        [HttpGet("heatmap")]
        public async Task<ActionResult<List<HeatmapPointDto>>> GetHeatmap()
        {
            var points = await _location.GetHeatmapAsync();
            return Ok(points.Select(p => new HeatmapPointDto(p.Lat, p.Lon, p.Count)));
        }

        /// <summary>Heatmap theo thời gian cụ thể (ngày + giờ).</summary>
        /// <param name="date">Ngày (format: yyyy-MM-dd) - optional</param>
        /// <param name="hour">Giờ (0-23) - optional</param>
        [HttpGet("heatmap-by-time")]
        public async Task<ActionResult<List<HeatmapPointDto>>> GetHeatmapByTime(
            [FromQuery] string? date,
            [FromQuery] int? hour)
        {
            var points = await _location.GetHeatmapByTimeAsync(date, hour);
            return Ok(points.Select(p => new HeatmapPointDto(p.Lat, p.Lon, p.Count)));
        }

        /// <summary>Thống kê tổng lượt nghe + biểu đồ theo ngày</summary>
        [HttpGet("listen-stats")]
        public async Task<ActionResult<DashboardStatsDto>> GetListenStats(
            [FromQuery] int? days)
        {
            var isAdmin = User.IsInRole("Admin");
            var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var since = days.HasValue ? DateTime.UtcNow.Date.AddDays(-(days.Value - 1)) : (DateTime?)null;

            int totalListens;
            List<DailyListenDto> dailyListens;

            if (!isAdmin && !string.IsNullOrWhiteSpace(accountId))
            {
                var ownerBaseQuery =
                    from h in _db.ListenHistories.AsNoTracking()
                    join p in _db.Pois.AsNoTracking() on h.PoiId equals p.PoiId
                    where p.AccountId == accountId
                    select h;

                totalListens = await ownerBaseQuery.CountAsync();

                if (since.HasValue)
                {
                    ownerBaseQuery = ownerBaseQuery.Where(h => h.Timestamp >= since.Value);
                }

                dailyListens = await ownerBaseQuery
                    .GroupBy(h => h.Timestamp.Date)
                    .Select(g => new DailyListenDto
                    {
                        Date = g.Key,
                        Count = g.Count(),
                        TotalDuration = g.Sum(x => x.ListenDuration)
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync();
            }
            else
            {
                totalListens = await _history.GetTotalListensAsync();
                dailyListens = await _history.GetDailyListensAsync(days);
            }

            return Ok(new DashboardStatsDto
            {
                TotalListens = totalListens,
                // cho chart
                DailyListens = dailyListens
            });
        }

        /// <summary>
        /// Timeline hoạt động của một thiết bị cụ thể:
        /// gộp LocationLog + ListenHistory → sắp xếp theo thời gian.
        /// GET /api/cms/analytics/devices/{deviceId}/activity?days=7
        /// </summary>
        [HttpGet("devices/{deviceId}/activity")]
        public async Task<ActionResult<DeviceActivityDto>> GetDeviceActivity(
            string deviceId,
            [FromQuery] int days = 7)
        {
            var since = DateTime.UtcNow.AddDays(-days);

            // ─── 1. Location logs của thiết bị ───────────────────────────
            var locations = await _db.LocationLogs.AsNoTracking()
                .Where(l => l.DeviceId == deviceId && l.Timestamp >= since)
                .OrderBy(l => l.Timestamp)
                .Select(l => new DeviceActivityEventDto(
                    "location",
                    l.Timestamp,
                    l.Latitude,
                    l.Longitude,
                    null, null, null))
                .ToListAsync();

            // ─── 2. Listen history của thiết bị ──────────────────────────
            var listens = await _db.ListenHistories.AsNoTracking()
                .Where(h => h.DeviceId == deviceId && h.Timestamp >= since)
                .OrderBy(h => h.Timestamp)
                .Select(h => new { h.PoiId, h.Timestamp, h.ListenDuration })
                .ToListAsync();

            // Lấy tên POI (một query duy nhất, tránh N+1)
            var poiIds = listens.Select(h => h.PoiId).Distinct().ToList();
            var poiTitles = await _db.PoiContents.AsNoTracking()
                .Where(c => poiIds.Contains(c.PoiId) && (c.IsMaster || c.LanguageCode == "vi"))
                .GroupBy(c => c.PoiId)
                .Select(g => new { PoiId = g.Key, Title = g.First().Title })
                .ToDictionaryAsync(x => x.PoiId, x => x.Title);

            var listenEvents = listens.Select(h => new DeviceActivityEventDto(
                "listen",
                h.Timestamp,
                null, null,
                h.PoiId,
                poiTitles.GetValueOrDefault(h.PoiId, h.PoiId),
                h.ListenDuration
            )).ToList();

            // ─── 3. Merge + sort theo thời gian ──────────────────────────
            var timeline = locations.Concat(listenEvents)
                .OrderBy(e => e.Timestamp)
                .ToList();

            var allTimestamps = timeline.Select(e => e.Timestamp).ToList();

            return Ok(new DeviceActivityDto(
                deviceId,
                allTimestamps.Count > 0 ? allTimestamps.Min() : null,
                allTimestamps.Count > 0 ? allTimestamps.Max() : null,
                locations.Count,
                listens.Count,
                timeline
            ));
        }
    }
}
