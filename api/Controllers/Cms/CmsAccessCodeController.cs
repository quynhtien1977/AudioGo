using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/accesscodes")]
    [Authorize(Roles = "Admin")] // PoiOwners might need codes too, or maybe only Admin can generate codes?
    public class CmsAccessCodeController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CmsAccessCodeController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAccessCodes([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            // Optional: limit generating codes to Admins only, but maybe PoiOwners want to give out codes?
            // Since there's no owner mapping on AppAccessCode, letting Admin manage all makes sense. 
            // We'll return all codes ordered by CreatedAt descending.
            
            var query = _db.AppAccessCodes.AsQueryable();

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            var items = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                data = items,
                pagination = new
                {
                    totalItems,
                    totalPages,
                    currentPage = page,
                    pageSize
                }
            });
        }

        public record CreateCodesRequest(int Count);

        [HttpPost]
        public async Task<IActionResult> CreateCodes([FromBody] CreateCodesRequest req)
        {
            if (req == null || req.Count <= 0 || req.Count > 100)
            {
                return BadRequest("Count must be between 1 and 100.");
            }

            var newCodes = new List<AppAccessCode>();
            for (int i = 0; i < req.Count; i++)
            {
                newCodes.Add(new AppAccessCode
                {
                    Code = GenerateRandomCode(),
                    CreatedAt = DateTime.UtcNow
                });
            }

            _db.AppAccessCodes.AddRange(newCodes);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = $"Successfully generated {req.Count} codes.",
                codes = newCodes
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCode(int id)
        {
            var code = await _db.AppAccessCodes.FindAsync(id);
            if (code == null) return NotFound();

            _db.AppAccessCodes.Remove(code);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Deleted successfully" });
        }

        private string GenerateRandomCode()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 8)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}
