using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/content/all-translations")]
    [Authorize]
    public class CmsTranslationController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CmsTranslationController(AppDbContext db)
        {
            
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTranslations([FromQuery] int page = 1, [FromQuery] int limit = 50)
        {
            var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(accountId)) return Unauthorized();

            bool isAdmin = User.IsInRole("Admin");

            var query = _db.PoiContents
                .Where(pc => pc.IsMaster)
                .Include(pc => pc.Poi)
                .ThenInclude(p => p.Contents)
                .AsNoTracking();

            if (!isAdmin)
            {
                query = query.Where(pc => pc.Poi != null && pc.Poi.AccountId == accountId);
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(pc => pc.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(pc => new 
                {
                    pc.ContentId,
                    pc.PoiId,
                    PoiName = pc.Title, // Tên địa điểm lấy từ Title
                    pc.LanguageCode,
                    pc.Description, // Sử dụng mô tả
                    pc.AudioUrl,
                    pc.IsMaster,
                    pc.CreatedAt,
                    pc.UpdatedAt,
                    Translations = pc.Poi != null ? pc.Poi.Contents.Where(c => !c.IsMaster).Select(c => new {
                        c.ContentId,
                        c.LanguageCode,
                        c.Title,
                        c.Description,
                        c.AudioUrl,
                        c.CreatedAt,
                        c.UpdatedAt
                    }).ToList() : null
                })
                .ToListAsync();

            return Ok(new
            {
                data = items,
                pagination = new
                {
                    total,
                    page,
                    limit,
                    totalPages = (int)Math.Ceiling((double)total / limit)
                }
            });
        }
    }
}
