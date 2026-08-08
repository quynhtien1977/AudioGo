using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Shared.DTOs;
using System.Text.Json;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/categories")]
    [Authorize]
    public class CmsCategoryController : ControllerBase
    {
        // GET actions: mọi role đã login (Owner cần xem danh sách category để gán POI)
        // POST/PUT/DELETE: chỉ Admin
        private readonly ICategoryRepository _repo;
        private readonly Server.Services.Interfaces.ITranslationService _translationService;

        public CmsCategoryController(ICategoryRepository repo, Server.Services.Interfaces.ITranslationService translationService)
        {
            _repo = repo;
            _translationService = translationService;
        }

        [HttpGet]
        public async Task<ActionResult<List<CategoryDto>>> GetAll()
        {
            var cats = await _repo.GetAllAsync();
            return Ok(cats.Select(ToDto));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryDto>> GetById(string id)
        {
            var cat = await _repo.GetByIdAsync(id);
            if (cat is null) return NotFound();
            return Ok(ToDto(cat));
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<CategoryDto>> Create([FromBody] CategoryCreateRequest req)
        {
            // Dịch Name sang 7 ngôn ngữ cố định
            var nameDict = await _translationService.TranslateToAllLanguagesAsync(req.Name, "vi");

            var cat = new Category
            {
                CategoryId    = Guid.NewGuid().ToString(),
                Name          = req.Name,                                // plain vi (CMS display/search)
                LocalizedName = JsonSerializer.Serialize(nameDict)       // JSON 7 langs
            };
            var created = await _repo.CreateAsync(cat);
            return CreatedAtAction(nameof(GetById), new { id = created.CategoryId }, ToDto(created));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<CategoryDto>> Update(
            string id, [FromBody] CategoryCreateRequest req)
        {
            var existing = await _repo.GetByIdAsync(id);
            if (existing is null) return NotFound();

            bool needsNameTrans = req.Name != null && 
                (req.Name != existing.Name || string.IsNullOrWhiteSpace(existing.LocalizedName) || !existing.LocalizedName.TrimStart().StartsWith("{"));

            if (needsNameTrans)
            {
                var newNameDict = await _translationService.TranslateToAllLanguagesAsync(req.Name!, "vi");
                existing.Name         = req.Name!;  // cập nhật plain vi
                existing.LocalizedName = MergeLocalizedJson(existing.LocalizedName, newNameDict);
            }

            var updated = await _repo.UpdateAsync(existing);
            return Ok(ToDto(updated!));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var ok = await _repo.DeleteAsync(id);
            if (!ok)
            {
                var exists = await _repo.GetByIdAsync(id);
                if (exists == null) return NotFound();
                return Conflict("Danh mục này đang được sử dụng bởi một số POI. Vui lòng gỡ POI khỏi danh mục trước khi xóa.");
            }
            return NoContent();
        }

        private static CategoryDto ToDto(Category c) =>
            new(c.CategoryId, c.Name, c.CategoryPois?.Count ?? 0, c.CreatedAt, c.UpdatedAt ?? default);

        /// <summary>Gán một POI vào category.</summary>
        [HttpPost("{id}/pois")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddPoi(string id, [FromBody] string poiId)
        {
            await _repo.AddPoiAsync(id, poiId);
            return NoContent();
        }

        /// <summary>Bỏ POI khỏi category.</summary>
        [HttpDelete("{id}/pois/{poiId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemovePoi(string id, string poiId)
        {
            await _repo.RemovePoiAsync(id, poiId);
            return NoContent();
        }

        // ── Helpers ──────────────────────────────────────────────────────

        /// <summary>
        /// Merge 7 ngôn ngữ mới vào JSON hiện có.
        /// Giữ nguyên các key ngoài 7 ngôn ngữ cố định (vd: custom lang keys).
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

            foreach (var (lang, val) in newValues)
                existing[lang] = val;

            return JsonSerializer.Serialize(existing);
        }
    }
}
