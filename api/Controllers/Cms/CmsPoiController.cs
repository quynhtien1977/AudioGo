using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Shared.DTOs;
using System.Security.Claims;
using Server.Services.Interfaces;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/pois")]
    [Authorize]
    [EnableCors("WebCmsPolicy")]
    public class CmsPoiController : ControllerBase
    {
        private readonly IPoiRepository _pois;
        private readonly ICmsPoiService _cmsPoiService;
        private readonly IPoiRequestService _poiRequestService;

        public CmsPoiController(IPoiRepository pois, ICmsPoiService cmsPoiService, IPoiRequestService poiRequestService)
        {
            _pois = pois;
            _cmsPoiService = cmsPoiService;
            _poiRequestService = poiRequestService;
        }

        /// <summary>Danh sách tất cả POI (CMS - không filter status published, có thể filter theo isActive).</summary>
        [HttpGet]
        public async Task<ActionResult<List<PoiListDto>>> GetAll([FromQuery] bool? isActive = null)
        {
            var result = await _cmsPoiService.GetAllForCmsAsync(isActive);
            return Ok(result);
        }

         /// <summary>Chi tiết POI kèm tất cả content, gallery và category.</summary>
        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(string id)
        {
            var poiDetail = await _cmsPoiService.GetPoiDetailForCmsAsync(id);
            if (poiDetail == null) return NotFound();
            return Ok(poiDetail);
        }

        // ===== REQUEST APIs =====

        /// <summary>Danh sách yêu cầu POI của Owner hiện tại.</summary>
        [HttpGet("requests/my-requests")]
        public async Task<ActionResult<List<PoiRequestListDto>>> GetMyPoiRequests([FromQuery] string? status = null)
        {
            var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(accountId)) return Unauthorized();

            var result = await _poiRequestService.GetMyPoiRequestsAsync(accountId, status);
            return Ok(result);
        }

        /// <summary>Chi tiết một yêu cầu POI - lấy proposedData (JSON) và rejectReason.</summary>
        [HttpGet("requests/{requestId}")]
        public async Task<ActionResult> GetPoiRequestDetail(string requestId)
        {
            var request = await _poiRequestService.GetPoiRequestDetailAsync(requestId);
            if (request == null) return NotFound();
            return Ok(request);
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

            if (string.IsNullOrEmpty(req.ActionType))
                return BadRequest("ActionType is required");

            if (req.ActionType != "DELETE" && req.Draft is null)
                return BadRequest("Draft is required for CREATE or UPDATE");

            var result = await _poiRequestService.SubmitPoiRequestAsync(accountId, req);
            return Ok(new { message = "Request submitted successfully", requestId = result });
        }
        
        /// <summary>Admin lấy danh sách request (có thể filter theo status)</summary>
        [HttpGet("requests")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<PoiRequestListDto>>> GetAllPoiRequests([FromQuery] string? status = "PENDING")
        {
            var result = await _poiRequestService.GetAllPoiRequestsAsync(status);
            return Ok(result);
        }

        /// <summary>Thống kê request PENDING theo ActionType</summary>
        [HttpGet("requests/stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRequestStats()
        {
            var result = await _poiRequestService.GetRequestStatsAsync();
            return Ok(result);
        }

        /// <summary>Admin phê duyệt hoặc từ chối POI request</summary>
        [HttpPut("requests/{requestId}/review")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ReviewPoiRequest(string requestId, [FromBody] ReviewPoiRequestDto reviewData)
        {
            var result = await _poiRequestService.ReviewPoiRequestAsync(requestId, reviewData);
            
            if (result.NotFound) 
                return NotFound(result.Message);
                
            if (!result.Success) 
                return StatusCode(500, new { error = result.Message, detail = result.Detail });

            return Ok(new
            {
                message = result.Message,
                requestId = result.RequestId,
                status = result.Status
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
            // Dùng GetByIdForCmsAsync để tìm POI bao gồm cả inactive (GetByIdAsync chỉ trả active)
            var existing = await _pois.GetByIdForCmsAsync(id);
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
