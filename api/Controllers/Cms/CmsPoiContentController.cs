using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/pois/{poiId}/content")]
    [Authorize]
    public class CmsPoiContentController : ControllerBase
    {
        private readonly IPoiContentService _service;

        public CmsPoiContentController(IPoiContentService service) => _service = service;

        [HttpGet]
        public async Task<ActionResult<List<PoiContentDto>>> GetAll(string poiId)
            => Ok(await _service.GetAllAsync(poiId));

        [HttpPost]
        public async Task<ActionResult<PoiContentDto>> Create(
            string poiId, [FromBody] PoiContentCreateRequest req)
        {
            var dto = await _service.CreateAsync(poiId, req);
            return CreatedAtAction(nameof(GetAll), new { poiId }, dto);
        }

        [HttpPut("{contentId}")]
        public async Task<ActionResult<PoiContentDto>> Update(
            string poiId, string contentId, [FromBody] PoiContentUpdateRequest req)
        {
            try   { return Ok(await _service.UpdateAsync(poiId, contentId, req)); }
            catch (KeyNotFoundException) { return NotFound(); }
        }

        [HttpDelete("{contentId}")]
        public async Task<IActionResult> Delete(string poiId, string contentId)
        {
            try   { await _service.DeleteAsync(poiId, contentId); return NoContent(); }
            catch (KeyNotFoundException) { return NotFound(); }
        }
    }
}
