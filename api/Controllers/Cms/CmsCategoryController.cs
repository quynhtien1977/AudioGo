using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Shared.DTOs;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/categories")]
    [Authorize]
    public class CmsCategoryController : ControllerBase
    {
        private readonly ICategoryRepository _repo;
        public CmsCategoryController(ICategoryRepository repo) => _repo = repo;

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
        public async Task<ActionResult<CategoryDto>> Create([FromBody] CategoryCreateRequest req)
        {
            var cat = new Category
            {
                CategoryId = Guid.NewGuid().ToString(),
                Name       = req.Name
            };
            var created = await _repo.CreateAsync(cat);
            return CreatedAtAction(nameof(GetById), new { id = created.CategoryId },
                ToDto(created));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CategoryDto>> Update(
            string id, [FromBody] CategoryCreateRequest req)
        {
            var existing = await _repo.GetByIdAsync(id);
            if (existing is null) return NotFound();

            existing.Name = req.Name;
            var updated = await _repo.UpdateAsync(existing);
            return Ok(ToDto(updated!));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var ok = await _repo.DeleteAsync(id);
            return ok ? NoContent() : NotFound();
        }

        private static CategoryDto ToDto(Category c) =>
            new(c.CategoryId, c.Name, c.CategoryPois?.Count ?? 0, c.CreatedAt);

        /// <summary>Gán một POI vào category.</summary>
        [HttpPost("{id}/pois")]
        public async Task<IActionResult> AddPoi(string id, [FromBody] string poiId)
        {
            await _repo.AddPoiAsync(id, poiId);
            return NoContent();
        }

        /// <summary>Bỏ POI khỏi category.</summary>
        [HttpDelete("{id}/pois/{poiId}")]
        public async Task<IActionResult> RemovePoi(string id, string poiId)
        {
            await _repo.RemovePoiAsync(id, poiId);
            return NoContent();
        }
    }
}
