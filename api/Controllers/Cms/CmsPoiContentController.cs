using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Shared.DTOs;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/pois/{poiId}/content")]
    [Authorize]
    public class CmsPoiContentController : ControllerBase
    {
        private readonly AppDbContext _db;
        public CmsPoiContentController(AppDbContext db) => _db = db;

        [HttpGet]
        public async Task<ActionResult<List<PoiContentDto>>> GetAll(string poiId)
        {
            var contents = await _db.PoiContents.AsNoTracking()
                .Where(c => c.PoiId == poiId)
                .ToListAsync();

            return Ok(contents.Select(c => new PoiContentDto(
                c.ContentId, c.PoiId, c.LanguageCode,
                c.Title, c.Description, c.AudioUrl, c.IsMaster)));
        }

        [HttpPost]
        public async Task<ActionResult<PoiContentDto>> Create(
            string poiId, [FromBody] PoiContentCreateRequest req)
        {
            var content = new PoiContent
            {
                ContentId    = Guid.NewGuid().ToString(),
                PoiId        = poiId,
                LanguageCode = req.LanguageCode,
                Title        = req.Title,
                Description  = req.Description,
                AudioUrl     = req.AudioUrl,
                IsMaster     = req.IsMaster
            };
            _db.PoiContents.Add(content);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), new { poiId },
                new PoiContentDto(content.ContentId, content.PoiId,
                    content.LanguageCode, content.Title,
                    content.Description, content.AudioUrl, content.IsMaster));
        }

        [HttpPut("{contentId}")]
        public async Task<ActionResult<PoiContentDto>> Update(
            string poiId, string contentId, [FromBody] PoiContentUpdateRequest req)
        {
            var content = await _db.PoiContents
                .FirstOrDefaultAsync(c => c.ContentId == contentId && c.PoiId == poiId);
            if (content is null) return NotFound();

            if (req.Title is not null)       content.Title       = req.Title;
            if (req.Description is not null) content.Description = req.Description;
            if (req.AudioUrl is not null)    content.AudioUrl    = req.AudioUrl;
            if (req.IsMaster.HasValue)       content.IsMaster    = req.IsMaster.Value;
            content.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new PoiContentDto(content.ContentId, content.PoiId,
                content.LanguageCode, content.Title,
                content.Description, content.AudioUrl, content.IsMaster));
        }

        [HttpDelete("{contentId}")]
        public async Task<IActionResult> Delete(string poiId, string contentId)
        {
            var content = await _db.PoiContents
                .FirstOrDefaultAsync(c => c.ContentId == contentId && c.PoiId == poiId);
            if (content is null) return NotFound();
            _db.PoiContents.Remove(content);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
