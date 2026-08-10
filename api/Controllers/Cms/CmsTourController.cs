using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Server.Models;
using Server.Repositories.Interfaces;
using Shared.DTOs;
using System.Text.Json;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/tours")]
    [Authorize]
    public class CmsTourController : ControllerBase
    {
        private readonly ITourRepository _repo;
        private readonly Server.Services.Interfaces.ITranslationService _translationService;

        public CmsTourController(ITourRepository repo, Server.Services.Interfaces.ITranslationService translationService)
        {
            _repo = repo;
            _translationService = translationService;
        }

        /// <summary>
        /// Lấy danh sách tour.
        /// Thêm ?includeInactive=true để CMS admin xem cả tour đã bị ẩn.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<TourDto>>> GetAll(
            [FromQuery] bool includeInactive = false)
        {
            var tours = includeInactive
                ? await _repo.GetAllIncludingInactiveAsync()
                : await _repo.GetAllAsync();
            return Ok(tours.Select(ToDto));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TourDto>> GetById(string id)
        {
            var tour = await _repo.GetByIdAsync(id);
            if (tour is null) return NotFound();
            return Ok(ToDto(tour));
        }

        [HttpPost]
        [EnableRateLimiting("cmsWrite")]
        public async Task<ActionResult<TourDto>> Create([FromBody] TourCreateRequest req)
        {
            // Dịch Name và Description sang 7 ngôn ngữ cố định
            var nameDict = await _translationService.TranslateToAllLanguagesAsync(req.Name, "vi");
            var descDict = string.IsNullOrWhiteSpace(req.Description)
                ? new Dictionary<string, string> { ["vi"] = "" }
                : await _translationService.TranslateToAllLanguagesAsync(req.Description, "vi");

            var tour = new Tour
            {
                TourId               = Guid.NewGuid().ToString(),
                Name                 = req.Name,                                         // plain vi (CMS search)
                LocalizedName        = JsonSerializer.Serialize(nameDict),               // JSON 7 langs
                LocalizedDescription = JsonSerializer.Serialize(descDict),               // JSON 7 langs
#pragma warning disable CS0618
                Description          = req.Description ?? string.Empty,                  // backward-compat
#pragma warning restore CS0618
                ThumbnailUrl         = req.ThumbnailUrl
            };
            var created = await _repo.CreateAsync(tour);
            return CreatedAtAction(nameof(GetById), new { id = created.TourId }, ToDto(created));
        }

        [HttpPut("{id}")]
        [EnableRateLimiting("cmsWrite")]
        public async Task<ActionResult<TourDto>> Update(
            string id, [FromBody] TourUpdateRequest req)
        {
            var existing = await _repo.GetByIdAsync(id);
            if (existing is null) return NotFound();

            // Nếu Name thay đổi HOẶC chưa có LocalizedName chuẩn → regenerate 7 ngôn ngữ cố định
            bool needsNameTrans = req.Name != null && 
                (req.Name != existing.Name || string.IsNullOrWhiteSpace(existing.LocalizedName) || !existing.LocalizedName.TrimStart().StartsWith("{"));
            
            if (needsNameTrans)
            {
                var newNameDict = await _translationService.TranslateToAllLanguagesAsync(req.Name!, "vi");
                existing.Name = req.Name!;
                existing.LocalizedName = MergeLocalizedJson(existing.LocalizedName, newNameDict);
            }

            // Nếu Description thay đổi HOẶC chưa có LocalizedDescription chuẩn → regenerate
#pragma warning disable CS0618
            bool needsDescTrans = req.Description != null && 
                (req.Description != existing.Description || string.IsNullOrWhiteSpace(existing.LocalizedDescription) || !existing.LocalizedDescription.TrimStart().StartsWith("{"));

            if (needsDescTrans)
            {
                var newDescDict = await _translationService.TranslateToAllLanguagesAsync(req.Description!, "vi");
                existing.LocalizedDescription = MergeLocalizedJson(existing.LocalizedDescription, newDescDict);
                existing.Description = req.Description!; // backward-compat
            }
#pragma warning restore CS0618

            existing.ThumbnailUrl = req.ThumbnailUrl ?? existing.ThumbnailUrl;

            var updated = await _repo.UpdateAsync(existing);
            return Ok(ToDto(updated!));
        }

        /// <summary>Soft-delete: ẩn tour khỏi danh sách (IsActive = false).</summary>
        [HttpDelete("{id}")]
        [EnableRateLimiting("cmsWrite")]
        public async Task<IActionResult> Delete(string id)
        {
            var ok = await _repo.DeleteAsync(id);
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Khôi phục tour đã bị ẩn (IsActive = true).</summary>
        [HttpPatch("{id}/restore")]
        public async Task<IActionResult> Restore(string id)
        {
            var ok = await _repo.RestoreAsync(id);
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Thêm POI vào tour theo thứ tự bước.</summary>
        [HttpPost("{id}/pois")]
        [EnableRateLimiting("cmsWrite")]
        public async Task<IActionResult> AddPoi(
            string id, [FromBody] TourPoiDto req)
        {
            await _repo.AddPoiAsync(id, req.PoiId, req.StepOrder);
            return NoContent();
        }

        /// <summary>Xoá POI khỏi tour.</summary>
        [HttpDelete("{id}/pois/{poiId}")]
        [EnableRateLimiting("cmsWrite")]
        public async Task<IActionResult> RemovePoi(string id, string poiId)
        {
            await _repo.RemovePoiAsync(id, poiId);
            return NoContent();
        }

        /// <summary>Thay đổi thứ tự bước của POI trong tour.</summary>
        [HttpPut("{id}/pois/{poiId}/order")]
        public async Task<IActionResult> ReorderPoi(
            string id, string poiId, [FromBody] int newOrder)
        {
            await _repo.ReorderPoiAsync(id, poiId, newOrder);
            return NoContent();
        }

        // ── Helpers ──────────────────────────────────────────────────────

        /// <summary>
        /// Merge 7 ngôn ngữ mới vào JSON hiện có.
        /// Giữ nguyên các key ngoài 7 ngôn ngữ cố định (vd: ngôn ngữ custom được append thủ công).
        /// </summary>
        private static string MergeLocalizedJson(string? existingJson, Dictionary<string, string> newValues)
        {
            var existing = new Dictionary<string, string>();
            if (!string.IsNullOrWhiteSpace(existingJson))
            {
                try
                {
                    var parsed = JsonSerializer.Deserialize<Dictionary<string, string>>(existingJson);
                    if (parsed != null) existing = parsed;
                }
                catch { }
            }

            // Chỉ overwrite 7 key cố định — giữ nguyên các key custom khác nếu có
            foreach (var (lang, val) in newValues)
                existing[lang] = val;

            return JsonSerializer.Serialize(existing);
        }

#pragma warning disable CS0618
        private static TourDto ToDto(Tour t) => new(
            t.TourId,
            t.Name,                                                          // plain vi cho CMS
            t.Description,
            t.TourPois.Count,
            t.ThumbnailUrl ?? t.TourPois.OrderBy(tp => tp.StepOrder).FirstOrDefault()?.Poi?.LogoUrl,
            t.CreatedAt,
            t.TourPois
#pragma warning restore CS0618
                .OrderBy(tp => tp.StepOrder)
                .Select(tp => new TourPoiDto(
                    tp.PoiId,
                    tp.Poi?.Contents.FirstOrDefault(c => c.LanguageCode == "vi")?.Title
                        ?? tp.Poi?.Contents.FirstOrDefault()?.Title
                        ?? tp.PoiId,
                    tp.StepOrder))
                .ToList(),
            t.IsActive);
    }
}
