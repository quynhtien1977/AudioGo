using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Shared.DTOs;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/pois/{poiId}/gallery")]
    [Authorize]
    public class CmsPoiGalleryController : ControllerBase
    {
        private readonly AppDbContext _db;
        public CmsPoiGalleryController(AppDbContext db) => _db = db;

        [HttpGet]
        public async Task<ActionResult<List<PoiGalleryDto>>> GetAll(string poiId)
        {
            var images = await _db.PoiGalleries.AsNoTracking()
                .Where(g => g.PoiId == poiId)
                .OrderBy(g => g.SortOrder)
                .ToListAsync();

            return Ok(images.Select(g =>
                new PoiGalleryDto(g.ImageId, g.PoiId, g.ImageUrl, g.SortOrder)));
        }

        /// <summary>Thêm ảnh bằng URL (upload file dùng /api/cms/upload/image trước).</summary>
        [HttpPost]
        public async Task<ActionResult<PoiGalleryDto>> Create(
            string poiId, [FromBody] PoiGalleryDto req)
        {
            var image = new PoiGallery
            {
                ImageId   = Guid.NewGuid().ToString(),
                PoiId     = poiId,
                ImageUrl  = req.ImageUrl,
                SortOrder = req.SortOrder
            };
            _db.PoiGalleries.Add(image);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), new { poiId },
                new PoiGalleryDto(image.ImageId, image.PoiId, image.ImageUrl, image.SortOrder));
        }

        [HttpDelete("{imageId}")]
        public async Task<IActionResult> Delete(string poiId, string imageId)
        {
            var image = await _db.PoiGalleries
                .FirstOrDefaultAsync(g => g.ImageId == imageId && g.PoiId == poiId);
            if (image is null) return NotFound();
            _db.PoiGalleries.Remove(image);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
