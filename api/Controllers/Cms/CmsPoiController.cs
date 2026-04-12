using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;
using Shared.DTOs;
using System.Security.Claims;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/pois")]
    [Authorize]
    [EnableCors("WebCmsPolicy")]
    public class CmsPoiController : ControllerBase
    {
        private readonly IPoiRepository _pois;
        private readonly AppDbContext _db;

        public CmsPoiController(IPoiRepository pois, AppDbContext db)
        {
            _pois = pois;
            _db   = db;
        }

        /// <summary>Danh sách tất cả POI (CMS - không filter status published, có thể filter theo isActive).</summary>

        // [HttpGet]
        // public async Task<ActionResult<List<PoiListDto>>> GetAll([FromQuery] string? status = null)
        // {
        //     var pois = await _pois.GetAllForCmsAsync(status);

        //     var result = pois.Select(p => new PoiListDto
        //     {
        //         PoiId = p.PoiId,
        //         Latitude = p.Latitude,
        //         Longitude = p.Longitude,
        //         ActivationRadius = p.ActivationRadius,
        //         Priority = p.Priority,
        //         Status = p.Status,
        //         LogoUrl = p.LogoUrl,
        //         IsActive = p.IsActive,
        //     }).ToList();

        //     return Ok(result);
        // }

        // api đã fix để lấy category name
        [HttpGet]
        public async Task<ActionResult<List<PoiListDto>>> GetAll([FromQuery] bool? isActive = null)
        {
            var pois = await _pois.GetAllForCmsAsync(isActive);

            var poiIds = pois.Select(p => p.PoiId).ToList();

            // 🔥 JOIN lấy category
            var categoryMap = await (
                from cp in _db.CategoryPois
                join c in _db.Categories on cp.CategoryId equals c.CategoryId
                where poiIds.Contains(cp.PoiId)
                group c by cp.PoiId into g
                select new
                {
                    PoiId = g.Key,
                    Category = g.Select(x => x.Name).FirstOrDefault()
                }
            ).ToDictionaryAsync(x => x.PoiId, x => x.Category);

            var result = pois.Select(p => new PoiListDto
            {
                PoiId = p.PoiId,
                Latitude = p.Latitude,
                Longitude = p.Longitude,
                ActivationRadius = p.ActivationRadius,
                Priority = p.Priority,
                LogoUrl = p.LogoUrl,
                IsActive = p.IsActive,

                // thêm category
                Category = categoryMap.GetValueOrDefault(p.PoiId, "Unknown")
            }).ToList();

            return Ok(result);
        }

        /// <summary>Chi tiết POI kèm tất cả content và gallery.</summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<PoiDetailDto>> GetById(string id)
        {
            var poi = await _db.Pois.AsNoTracking()
                .Include(p => p.Contents)
                .Include(p => p.Gallery)
                .FirstOrDefaultAsync(p => p.PoiId == id);

            if (poi is null) return NotFound();

            return Ok(new PoiDetailDto(
                poi.PoiId, poi.Latitude, poi.Longitude,
                poi.ActivationRadius, poi.Priority, poi.IsActive, poi.LogoUrl,
                poi.CreatedAt, poi.UpdatedAt,
                poi.Contents.Select(c => new PoiContentDto(
                    c.ContentId, c.PoiId, c.LanguageCode,
                    c.Title, c.Description, c.AudioUrl, c.IsMaster)).ToList(),
                poi.Gallery.OrderBy(g => g.SortOrder)
                    .Select(g => new PoiGalleryDto(g.ImageId, g.PoiId, g.ImageUrl, g.SortOrder)).ToList()
            ));
        }
        
        [HttpPost]
        public async Task<ActionResult<Poi>> Create([FromBody] PoiCreateRequest req)
        {
            var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(accountId)) return Unauthorized();

            var poi = new Poi
            {
                PoiId            = Guid.NewGuid().ToString(),
                AccountId        = accountId,
                Latitude         = req.Latitude,
                Longitude        = req.Longitude,
                ActivationRadius = req.ActivationRadius,
                Priority         = req.Priority,
                LogoUrl          = req.LogoUrl
            };
            var created = await _pois.CreateAsync(poi);
            return CreatedAtAction(nameof(GetById), new { id = created.PoiId }, created);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Poi>> Update(string id, [FromBody] PoiUpdateRequest req)
        {
            var existing = await _pois.GetByIdAsync(id);
            if (existing is null) return NotFound();

            if (req.Latitude.HasValue)         existing.Latitude         = req.Latitude.Value;
            if (req.Longitude.HasValue)        existing.Longitude        = req.Longitude.Value;
            if (req.ActivationRadius.HasValue) existing.ActivationRadius = req.ActivationRadius.Value;
            if (req.Priority.HasValue)         existing.Priority         = req.Priority.Value;
            if (req.LogoUrl is not null)       existing.LogoUrl          = req.LogoUrl;
            if (req.IsActive.HasValue)         existing.IsActive         = req.IsActive.Value;

            var updated = await _pois.UpdateAsync(existing);
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var ok = await _pois.DeleteAsync(id);
            return ok ? NoContent() : NotFound();
        }
    }
}
