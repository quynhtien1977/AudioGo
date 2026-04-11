using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Repositories.Interfaces;
using Shared.DTOs;

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
        [HttpGet("top-pois")]
        public async Task<ActionResult<List<TopPoiDto>>> GetTopPois(
            [FromQuery] int top = 10)
        {
            var topPois = await _history.GetTopPoisAsync(top);

            // 1 query duy nhất lấy tất cả titles — tránh N+1
            var poiIds = topPois.Select(tp => tp.PoiId).ToList();
            var titles = await _db.PoiContents.AsNoTracking()
                .Where(c => poiIds.Contains(c.PoiId) && (c.IsMaster || c.LanguageCode == "vi"))
                .GroupBy(c => c.PoiId)
                .Select(g => new { PoiId = g.Key, Title = g.First().Title })
                .ToDictionaryAsync(x => x.PoiId, x => x.Title);

            var result = topPois
                .Select(tp => new TopPoiDto(tp.PoiId, titles.GetValueOrDefault(tp.PoiId, tp.PoiId), tp.Count))
                .ToList();
            return Ok(result);
        }

        /// <summary>Heatmap vị trí người dùng (nhóm theo ô ~100m).</summary>
        [HttpGet("heatmap")]
        public async Task<ActionResult<List<HeatmapPointDto>>> GetHeatmap()
        {
            var points = await _location.GetHeatmapAsync();
            return Ok(points.Select(p => new HeatmapPointDto(p.Lat, p.Lon, p.Count)));
        }

        /// <summary>Thống kê tổng lượt nghe + biểu đồ theo ngày</summary>
        [HttpGet("listen-stats")]
        public async Task<ActionResult<DashboardStatsDto>> GetListenStats(
            [FromQuery] int? days)
        {
            var totalListens = await _history.GetTotalListensAsync();

            // cho chart
            // var dailyListens = await _history.GetDailyListensAsync(days);

            return Ok(new DashboardStatsDto
            {
                TotalListens = totalListens,
                // cho chart
                // DailyListens = dailyListens
            });
        }
    }
}
