using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Queues;
using Server.Repositories.Interfaces;
using Shared.DTOs;

namespace Server.Controllers.Mobile
{
    [ApiController]
    [Route("api/mobile/listen-history")]
    public class ListenHistoryController : ControllerBase
    {
        private readonly IListenHistoryQueue _queue;
        private readonly IListenHistoryRepository _repo;

        public ListenHistoryController(IListenHistoryQueue queue, IListenHistoryRepository repo)
        {
            _queue = queue;
            _repo  = repo;
        }

        /// <summary>Mobile ghi nhận sự kiện nghe xong 1 POI.</summary>
        [HttpPost]
        public async Task<ActionResult<ListenHistoryResponse>> Create(
            [FromBody] ListenHistoryRequest req)
        {
            var entry = new ListenHistory
            {
                HistoryId      = Guid.NewGuid().ToString(),
                DeviceId       = req.DeviceId,
                PoiId          = req.PoiId,
                ListenDuration = req.ListenDuration,
                Timestamp      = DateTime.UtcNow
            };

            await _queue.QueueListenHistoryAsync(entry);

            return Accepted(new ListenHistoryResponse
            {
                HistoryId      = entry.HistoryId,
                DeviceId       = entry.DeviceId,
                PoiId          = entry.PoiId,
                Timestamp      = entry.Timestamp,
                ListenDuration = entry.ListenDuration
            });
        }

        /// <summary>
        /// Lấy danh sách tối đa <paramref name="limit"/> POI nghe gần nhất của thiết bị.
        /// Dùng cho section "Tiếp tục nghe" trên trang chủ mobile.
        /// </summary>
        [HttpGet("{deviceId}")]
        public async Task<ActionResult<List<ListenHistoryItemDto>>> GetByDevice(
            string deviceId,
            [FromQuery] string lang  = "vi",
            [FromQuery] int    limit = 5)
        {
            if (string.IsNullOrWhiteSpace(deviceId))
                return BadRequest("deviceId is required.");

            limit = Math.Clamp(limit, 1, 20);

            var items = await _repo.GetByDeviceAsync(deviceId, lang, limit);

            // Patch relative LogoUrl → absolute URL
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            foreach (var item in items)
            {
                if (!string.IsNullOrEmpty(item.LogoUrl) && !item.LogoUrl.StartsWith("http"))
                    item.LogoUrl = $"{baseUrl}/{item.LogoUrl.TrimStart('/')}";
            }

            return Ok(items);
        }
    }
}
