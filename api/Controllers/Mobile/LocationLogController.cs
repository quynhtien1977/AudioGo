using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Queues;
using Shared.DTOs;

namespace Server.Controllers.Mobile
{
    [ApiController]
    [Route("api/mobile/location-log")]
    public class LocationLogController : ControllerBase
    {
        private readonly ILocationQueue _queue;
        public LocationLogController(ILocationQueue queue) => _queue = queue;

        /// <summary>Mobile gửi batch GPS log (offline buffer flush).</summary>
        [HttpPost]
        public async Task<IActionResult> CreateBatch([FromBody] LocationLogBatchRequest req)
        {
            var logs = req.Points.Select(p => new LocationLog
            {
                LocationId = Guid.NewGuid().ToString(),
                DeviceId   = req.DeviceId,
                Latitude   = p.Latitude,
                Longitude  = p.Longitude,
                Timestamp  = p.Timestamp
            });

            foreach (var log in logs)
            {
                await _queue.QueueLocationAsync(log);
            }

            return Accepted();
        }
    }
}
