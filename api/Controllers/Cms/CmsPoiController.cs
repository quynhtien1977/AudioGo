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

            // JOIN lấy category
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
                Name = p.Contents.FirstOrDefault(c => c.IsMaster)?.Title ?? "Chưa có tên",
                AccountId = p.AccountId,
                Latitude = p.Latitude,
                Longitude = p.Longitude,
                ActivationRadius = p.ActivationRadius,
                Priority = p.Priority,
                LogoUrl = p.LogoUrl,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,

                // thêm category
                Category = categoryMap.GetValueOrDefault(p.PoiId, "Unknown")
            }).ToList();

            return Ok(result);
        }

         /// <summary>Chi tiết POI kèm tất cả content, gallery và category.</summary>
        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(string id)
        {
            var poi = await _db.Pois.AsNoTracking()
                .Include(p => p.Contents)
                .Include(p => p.Gallery)
                .FirstOrDefaultAsync(p => p.PoiId == id);

            if (poi is null) return NotFound();

            // Lấy category
            var category = await (
                from cp in _db.CategoryPois
                join c in _db.Categories on cp.CategoryId equals c.CategoryId
                where cp.PoiId == id
                select c.Name
            ).FirstOrDefaultAsync();

            return Ok(new
            {
                poiId = poi.PoiId,
                accountId = poi.AccountId,
                latitude = poi.Latitude,
                longitude = poi.Longitude,
                activationRadius = poi.ActivationRadius,
                priority = poi.Priority,
                isActive = poi.IsActive,
                logoUrl = poi.LogoUrl,
                createdAt = poi.CreatedAt,
                updatedAt = poi.UpdatedAt,
                category = category ?? "Unknown",
                contents = poi.Contents.Select(c => new
                {
                    contentId = c.ContentId,
                    poiId = c.PoiId,
                    languageCode = c.LanguageCode,
                    title = c.Title,
                    description = c.Description,
                    audioUrl = c.AudioUrl,
                    isMaster = c.IsMaster
                }).ToList(),
                gallery = poi.Gallery.OrderBy(g => g.SortOrder)
                    .Select(g => new
                    {
                        imageId = g.ImageId,
                        poiId = g.PoiId,
                        imageUrl = g.ImageUrl,
                        sortOrder = g.SortOrder
                    }).ToList()
            });
        }
        // ===== REQUEST APIs =====
        /// <summary>Danh sách yêu cầu POI của Owner hiện tại.</summary>
        [HttpGet("requests/my-requests")]
        public async Task<ActionResult<List<PoiRequestListDto>>> GetMyPoiRequests([FromQuery] string? status = null)
        {
            var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(accountId)) return Unauthorized();

            var query = _db.PoiRequests
                .Where(pr => pr.AccountId == accountId)
                .AsNoTracking();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(pr => pr.Status == status);
            }

            var requests = await query
                .OrderByDescending(pr => pr.CreatedAt)
                .ToListAsync();

            var result = requests.Select(pr => new PoiRequestListDto(
                RequestId: pr.RequestId,
                PoiId: pr.PoiId,
                AccountId: pr.AccountId,
                ActionType: pr.ActionType,
                Status: pr.Status,
                CreatedAt: pr.CreatedAt,
                RejectReason: pr.RejectReason
            )).ToList();

            return Ok(result);
        }

        /// <summary>Chi tiết một yêu cầu POI - lấy proposedData (JSON) và rejectReason.</summary>
        [HttpGet("requests/{requestId}")]
        public async Task<ActionResult> GetPoiRequestDetail(string requestId)
        {
            var request = await _db.PoiRequests.AsNoTracking()
                .FirstOrDefaultAsync(r => r.RequestId == requestId);

            if (request is null) return NotFound();

            return Ok(new
            {
                requestId = request.RequestId,
                poiId = request.PoiId,
                actionType = request.ActionType,
                proposedData = request.ProposedData,
                rejectReason = request.RejectReason,
                status = request.Status
            });
        }

        /// <summary>
        /// Owner gửi yêu cầu tạo / cập nhật / xoá POI
        /// </summary>
        [HttpPost("requests")]
        public async Task<IActionResult> SubmitPoiRequest([FromBody] SubmitPoiRequestDto req)
        {
            var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(accountId))
                return Unauthorized();

            // validate
            if (string.IsNullOrEmpty(req.ActionType))
                return BadRequest("ActionType is required");

            if (req.ActionType != "DELETE" && req.Draft is null)
                return BadRequest("Draft is required for CREATE or UPDATE");

            // 🔥 convert Draft -> JSON string để lưu DB
            string? proposedData = req.Draft != null
                ? System.Text.Json.JsonSerializer.Serialize(req.Draft)
                : null;

            var request = new PoiRequest
            {
                RequestId    = Guid.NewGuid().ToString(),
                PoiId        = req.PoiId,
                AccountId    = accountId,
                ActionType   = req.ActionType.ToUpper(),
                Status       = "PENDING",
                ProposedData = proposedData,
                RejectReason = null,
                CreatedAt    = DateTime.UtcNow,
                UpdatedAt    = DateTime.UtcNow
            };

            _db.PoiRequests.Add(request);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Request submitted successfully",
                requestId = request.RequestId
            });
        }
        
        /// <summary>Admin lấy danh sách request (có thể filter theo status)</summary>
        [HttpGet("requests")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<PoiRequestListDto>>> GetAllPoiRequests([FromQuery] string? status = "PENDING")
        {
            var query = _db.PoiRequests.AsNoTracking();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(x => x.Status == status);
            }

            var requests = await query
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            var result = requests.Select(pr => new PoiRequestListDto(
                pr.RequestId,
                pr.PoiId,
                pr.AccountId,
                pr.ActionType,
                pr.Status,
                pr.CreatedAt,
                pr.RejectReason
            )).ToList();

            return Ok(result);
        }

        /// <summary>Thống kê request PENDING theo ActionType</summary>
        [HttpGet("requests/stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRequestStats()
        {
            var stats = await _db.PoiRequests
                .Where(x => x.Status == "PENDING")
                .GroupBy(x => x.ActionType)
                .Select(g => new
                {
                    ActionType = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            return Ok(new
            {
                newCount    = stats.FirstOrDefault(x => x.ActionType == "CREATE")?.Count ?? 0,
                updateCount = stats.FirstOrDefault(x => x.ActionType == "UPDATE")?.Count ?? 0,
                deleteCount = stats.FirstOrDefault(x => x.ActionType == "DELETE")?.Count ?? 0
            });
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
