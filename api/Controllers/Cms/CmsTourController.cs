using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Shared.DTOs;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/tours")]
    [Authorize]
    public class CmsTourController : ControllerBase
    {
        private readonly ITourRepository _repo;
        public CmsTourController(ITourRepository repo) => _repo = repo;

        [HttpGet]
        public async Task<ActionResult<List<TourDto>>> GetAll()
        {
            var tours = await _repo.GetAllAsync();
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
        public async Task<ActionResult<TourDto>> Create([FromBody] TourCreateRequest req)
        {
            var tour = new Tour
            {
                TourId      = Guid.NewGuid().ToString(),
                Name        = req.Name,
                Description = req.Description
            };
            var created = await _repo.CreateAsync(tour);
            return CreatedAtAction(nameof(GetById), new { id = created.TourId }, ToDto(created));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TourDto>> Update(
            string id, [FromBody] TourUpdateRequest req)
        {
            var existing = await _repo.GetByIdAsync(id);
            if (existing is null) return NotFound();

            existing.Name        = req.Name        ?? existing.Name;
            existing.Description = req.Description ?? existing.Description;

            var updated = await _repo.UpdateAsync(existing);
            return Ok(ToDto(updated!));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var ok = await _repo.DeleteAsync(id);
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Thêm POI vào tour theo thứ tự bước.</summary>
        [HttpPost("{id}/pois")]
        public async Task<IActionResult> AddPoi(
            string id, [FromBody] TourPoiDto req)
        {
            await _repo.AddPoiAsync(id, req.PoiId, req.StepOrder);
            return NoContent();
        }

        /// <summary>Xoá POI khỏi tour.</summary>
        [HttpDelete("{id}/pois/{poiId}")]
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

        private static TourDto ToDto(Tour t) => new(
            t.TourId, t.Name, t.Description, t.CreatedAt,
            t.TourPois
                .OrderBy(tp => tp.StepOrder)
                .Select(tp => new TourPoiDto(
                    tp.PoiId,
                    tp.Poi?.Contents.FirstOrDefault()?.Title ?? tp.PoiId,
                    tp.StepOrder))
                .ToList());
    }
}
