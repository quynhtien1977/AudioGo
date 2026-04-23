using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Queues;
using Shared.DTOs;

namespace Server.Controllers.Mobile
{
    [ApiController]
    [Route("api/mobile/listen-history")]
    public class ListenHistoryController : ControllerBase
    {
        private readonly IListenHistoryQueue _queue;
        public ListenHistoryController(IListenHistoryQueue queue) => _queue = queue;

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
    }
}
