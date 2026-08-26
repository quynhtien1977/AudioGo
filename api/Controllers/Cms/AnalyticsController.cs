using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;
using System.Security.Claims;
using Shared.DTOs;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/analytics")]
    [Authorize]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService       _analytics;
        private readonly ILocationLogRepository  _location;

        public AnalyticsController(
            IAnalyticsService analytics,
            ILocationLogRepository location)
        {
            _analytics = analytics;
            _location  = location;
        }

        /// <summary>Top N POI được nghe nhiều nhất.</summary>
        [HttpGet("top-pois")]
        public async Task<IActionResult> GetTopPois([FromQuery] int top = 10)
        {
            var isOwner   = User.IsInRole("Owner");
            var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var result = await _analytics.GetTopPoisAsync(accountId, isOwner, top);
            return Ok(result);
        }

        /// <summary>Heatmap vị trí người dùng (nhóm theo ô ~100m).</summary>
        [HttpGet("heatmap")]
        public async Task<IActionResult> GetHeatmap()
        {
            var points = await _location.GetHeatmapAsync();
            return Ok(points.Select(p => new HeatmapPointDto(p.Lat, p.Lon, p.Count)));
        }

        /// <summary>Heatmap theo thời gian cụ thể (ngày + giờ).</summary>
        [HttpGet("heatmap-by-time")]
        public async Task<IActionResult> GetHeatmapByTime(
            [FromQuery] string? date,
            [FromQuery] int? hour)
        {
            var points = await _location.GetHeatmapByTimeAsync(date, hour);
            return Ok(points.Select(p => new HeatmapPointDto(p.Lat, p.Lon, p.Count)));
        }

        /// <summary>Thống kê tổng lượt nghe + biểu đồ theo ngày.</summary>
        [HttpGet("listen-stats")]
        public async Task<IActionResult> GetListenStats([FromQuery] int? days)
        {
            var isOwner   = User.IsInRole("Owner");
            var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var result = await _analytics.GetListenStatsAsync(accountId, isOwner, days);
            return Ok(result);
        }

        /// <summary>
        /// Timeline hoạt động của một thiết bị cụ thể:
        /// gộp LocationLog + ListenHistory → sắp xếp theo thời gian.
        /// GET /api/cms/analytics/devices/{deviceId}/activity?days=7
        /// </summary>
        [HttpGet("devices/{deviceId}/activity")]
        public async Task<IActionResult> GetDeviceActivity(
            string deviceId,
            [FromQuery] int days = 7)
        {
            var result = await _analytics.GetDeviceActivityAsync(deviceId, days);
            return Ok(result);
        }
    }
}
