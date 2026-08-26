using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Services.Interfaces;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/accesscodes")]
    [Authorize(Roles = "Admin")]
    public class CmsAccessCodeController : ControllerBase
    {
        private readonly IAccessCodeService _accessCode;

        public CmsAccessCodeController(IAccessCodeService accessCode)
        {
            _accessCode = accessCode;
        }

        [HttpGet]
        public async Task<IActionResult> GetAccessCodes(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var result = await _accessCode.GetPagedAsync(page, pageSize);
            return Ok(result);
        }

        public record CreateCodesRequest(int Count);

        [HttpPost]
        public async Task<IActionResult> CreateCodes([FromBody] CreateCodesRequest req)
        {
            var (created, error) = await _accessCode.CreateCodesAsync(req?.Count ?? 0);
            if (error is not null) return BadRequest(error);

            return Ok(new
            {
                message = $"Successfully generated {created.Count} codes.",
                codes   = created
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCode(int id)
        {
            var deleted = await _accessCode.DeleteCodeAsync(id);
            return deleted ? Ok(new { message = "Deleted successfully" }) : NotFound();
        }
    }
}
