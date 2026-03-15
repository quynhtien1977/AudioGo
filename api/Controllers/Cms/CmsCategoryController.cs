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
            return Ok(cats.Select(c => new CategoryDto(c.CategoryId, c.Name, c.CreatedAt)));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryDto>> GetById(string id)
        {
            var cat = await _repo.GetByIdAsync(id);
            if (cat is null) return NotFound();
            return Ok(new CategoryDto(cat.CategoryId, cat.Name, cat.CreatedAt));
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
                new CategoryDto(created.CategoryId, created.Name, created.CreatedAt));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CategoryDto>> Update(
            string id, [FromBody] CategoryCreateRequest req)
        {
            var updated = await _repo.UpdateAsync(new Category { CategoryId = id, Name = req.Name });
            if (updated is null) return NotFound();
            return Ok(new CategoryDto(updated.CategoryId, updated.Name, updated.CreatedAt));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var ok = await _repo.DeleteAsync(id);
            return ok ? NoContent() : NotFound();
        }

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
