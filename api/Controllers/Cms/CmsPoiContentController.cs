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
    [Route("api/cms/pois/{poiId}/content")]
    [Authorize(Roles = "Admin,Owner")]
    public class CmsPoiContentController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IPoiRepository _pois;
        public CmsPoiContentController(AppDbContext db, IPoiRepository pois)
        {
            _db = db;
            _pois = pois;
        }

                [HttpGet]
        public async Task<ActionResult<List<PoiContentDto>>> GetAll(string poiId)
        {
            // Ownership check
            var (error, _) = await PoiOwnershipHelper.CheckOwnershipAsync(poiId, User, _pois);
            if (error != null) return error as ActionResult ?? StatusCode(403);

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
            // Ownership check
            var (error, _) = await PoiOwnershipHelper.CheckOwnershipAsync(poiId, User, _pois);
            if (error != null) return error as ActionResult ?? StatusCode(403);

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
            // Ownership check
            var (error, _) = await PoiOwnershipHelper.CheckOwnershipAsync(poiId, User, _pois);
            if (error != null) return error as ActionResult ?? StatusCode(403);

            var content = await _db.PoiContents
                .FirstOrDefaultAsync(c => c.ContentId == contentId && c.PoiId == poiId);
            if (content is null) return NotFound();

            bool isMasterDataChanged = false;

            if (req.Title is not null && req.Title != content.Title) 
            {
                content.Title = req.Title;
                isMasterDataChanged = true;
            }

            if (req.Description is not null && req.Description != content.Description) 
            {
                content.Description = req.Description;
                isMasterDataChanged = true;
            }

            if (req.AudioUrl is not null)    content.AudioUrl    = req.AudioUrl;
            if (req.IsMaster.HasValue)       content.IsMaster    = req.IsMaster.Value;
            
            // LOGIC QUAN TRỌNG: Nếu update bản Master và đổi nội dung, xóa sạch các bản dịch (Slave) đã gen trước đó!
            if (content.IsMaster && isMasterDataChanged)
            {
                var slaves = await _db.PoiContents
                    .Where(c => c.PoiId == poiId && c.ContentId != content.ContentId && !c.IsMaster)
                    .ToListAsync();
                
                if (slaves.Any())
                {
                    _db.PoiContents.RemoveRange(slaves);
                }
            }
            content.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new PoiContentDto(content.ContentId, content.PoiId,
                content.LanguageCode, content.Title,
                content.Description, content.AudioUrl, content.IsMaster));
        }

                [HttpDelete("{contentId}")]
        public async Task<IActionResult> Delete(string poiId, string contentId)
        {
            // Ownership check
            var (error, _) = await PoiOwnershipHelper.CheckOwnershipAsync(poiId, User, _pois);
            if (error != null) return error;

            var content = await _db.PoiContents
                .FirstOrDefaultAsync(c => c.ContentId == contentId && c.PoiId == poiId);
            if (content is null) return NotFound();
            _db.PoiContents.Remove(content);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
