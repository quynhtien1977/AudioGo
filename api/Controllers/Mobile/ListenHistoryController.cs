using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Shared.DTOs;

namespace Server.Controllers.Mobile
{
    [ApiController]
    [Route("api/mobile/listen-history")]
    public class ListenHistoryController : ControllerBase
    {
        private readonly IListenHistoryRepository _repo;
        public ListenHistoryController(IListenHistoryRepository repo) => _repo = repo;

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

            await _repo.CreateAsync(entry);

            return Ok(new ListenHistoryResponse(
                entry.HistoryId,
                entry.DeviceId,
                entry.PoiId,
                entry.Timestamp,
                entry.ListenDuration));
        }
    }
}
