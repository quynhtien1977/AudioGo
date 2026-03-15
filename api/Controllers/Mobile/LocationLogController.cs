using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Shared.DTOs;

namespace Server.Controllers.Mobile
{
    [ApiController]
    [Route("api/mobile/location-log")]
    public class LocationLogController : ControllerBase
    {
        private readonly ILocationLogRepository _repo;
        public LocationLogController(ILocationLogRepository repo) => _repo = repo;

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

            await _repo.CreateBatchAsync(logs);
            return NoContent();
        }
    }
}
