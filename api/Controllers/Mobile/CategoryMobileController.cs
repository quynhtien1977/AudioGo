using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Server.Repositories.Interfaces;
using Shared.DTOs;

namespace Server.Controllers.Mobile
{
    [ApiController]
    [Route("api/mobile/categories")]
    [EnableCors("MobilePolicy")]
    public class CategoryMobileController : ControllerBase
    {
        private readonly ICategoryRepository _repo;

        public CategoryMobileController(ICategoryRepository repo)
        {
            _repo = repo;
        }

        /// <summary>
        /// GET /api/mobile/categories
        /// Returns all categories with poi count for chip display.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll()
        {
            var categories = await _repo.GetAllAsync();
            var dtos = categories
                .OrderBy(c => c.Name)
                .Select(c => new CategoryDto(
                    c.CategoryId,
                    c.Name,
                    c.CategoryPois.Count,
                    c.CreatedAt))
                .ToList();
            return Ok(dtos);
        }
    }
}
