using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/pois/{poiId}/gallery")]
    [Authorize]
    public class CmsPoiGalleryController : ControllerBase
    {
        private readonly IPoiGalleryService _service;

        public CmsPoiGalleryController(IPoiGalleryService service) => _service = service;

        [HttpGet]
        public async Task<ActionResult<List<PoiGalleryDto>>> GetAll(string poiId)
            => Ok(await _service.GetAllAsync(poiId));

        /// <summary>Thêm ảnh bằng URL (upload file dùng /api/cms/upload/image trước).</summary>
        [HttpPost]
        public async Task<ActionResult<PoiGalleryDto>> Create(
            string poiId, [FromBody] PoiGalleryDto req)
        {
            var dto = await _service.CreateAsync(poiId, req);
            return CreatedAtAction(nameof(GetAll), new { poiId }, dto);
        }

        [HttpDelete("{imageId}")]
        public async Task<IActionResult> Delete(string poiId, string imageId)
        {
            try   { await _service.DeleteAsync(poiId, imageId); return NoContent(); }
            catch (KeyNotFoundException) { return NotFound(); }
        }
    }
}
