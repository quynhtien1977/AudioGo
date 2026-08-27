using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Services.Interfaces;

namespace Server.Controllers.Cms;

/// <summary>
/// Quản lý phiên bản APK — Admin quản lý, Editor chỉ xem.
/// </summary>
[ApiController]
[Route("api/cms/app-releases")]
[Authorize(Roles = "Admin,Editor")]
public class CmsAppReleaseController : ControllerBase
{
    private readonly IAppReleaseService _service;

    public CmsAppReleaseController(IAppReleaseService service) => _service = service;

    // ── GET /api/cms/app-releases ─────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _service.GetAllAsync());

    // ── POST /api/cms/app-releases ────────────────────────────────────────
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(209_715_200)] // 200MB
    public async Task<IActionResult> Upload(
        IFormFile       file,
        [FromForm] string  version,
        [FromForm] string? releaseNotes,
        [FromForm] string? minAndroidVersion)
    {
        try
        {
            var dto = await _service.UploadAsync(
                file, version, releaseNotes, minAndroidVersion,
                User.FindFirst("sub")?.Value);
            return Ok(new { dto.ReleaseId, dto.Version, dto.ApkUrl });
        }
        catch (ArgumentException ex)   { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return StatusCode(500, new { message = ex.Message }); }
    }

    // ── DELETE /api/cms/app-releases/{id} ────────────────────────────────
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(string id)
    {
        try
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)          { return NotFound(); }
        catch (InvalidOperationException ex)  { return BadRequest(new { message = ex.Message }); }
    }
}
