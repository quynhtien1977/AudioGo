using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Helpers;
using Server.Models;
using Server.Repositories.Interfaces;
using Shared.DTOs;
using System.Security.Claims;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/pois/{poiId}/gallery")]
    [Authorize(Roles = "Admin,Owner")]
    public class CmsPoiGalleryController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IPoiRepository _pois;
        public CmsPoiGalleryController(AppDbContext db, IPoiRepository pois)
        {
            _db = db;
            _pois = pois;
        }

                [HttpGet]
        public async Task<ActionResult<List<PoiGalleryDto>>> GetAll(string poiId)
        {
            var (error, _) = await PoiOwnershipHelper.CheckOwnershipAsync(poiId, User, _pois);
            if (error != null) return error as ActionResult ?? StatusCode(403);

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
            var (error, _) = await PoiOwnershipHelper.CheckOwnershipAsync(poiId, User, _pois);
            if (error != null) return error as ActionResult ?? StatusCode(403);

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
            var (error, _) = await PoiOwnershipHelper.CheckOwnershipAsync(poiId, User, _pois);
            if (error != null) return error;

            var image = await _db.PoiGalleries
                .FirstOrDefaultAsync(g => g.ImageId == imageId && g.PoiId == poiId);
            if (image is null) return NotFound();
            _db.PoiGalleries.Remove(image);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
