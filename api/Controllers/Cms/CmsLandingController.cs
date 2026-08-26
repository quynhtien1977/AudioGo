using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Services.Interfaces;
using System.Security.Claims;

namespace Server.Controllers.Cms;

/// <summary>
/// Quản lý nội dung Landing Page — Admin + Editor.
/// Mọi business logic và DB access đã được delegate sang ILandingService.
/// </summary>
[ApiController]
[Route("api/cms/landing")]
[Authorize(Roles = "Admin,Editor")]
public class CmsLandingController : ControllerBase
{
    private readonly ILandingService _landing;

    public CmsLandingController(ILandingService landing)
    {
        _landing = landing;
    }

    // GET /api/cms/landing/sections
    [HttpGet("sections")]
    public async Task<IActionResult> GetSections()
    {
        var sections = await _landing.GetAllSectionsAsync();
        return Ok(sections);
    }

    // GET /api/cms/landing/sections/{id}
    [HttpGet("sections/{id}")]
    public async Task<IActionResult> GetSection(string id)
    {
        var section = await _landing.GetSectionByIdAsync(id);
        return section is null ? NotFound() : Ok(section);
    }

    // PATCH /api/cms/landing/sections/{id}/meta
    [HttpPatch("sections/{id}/meta")]
    public async Task<IActionResult> UpdateMeta(string id, [FromBody] UpdateMetaRequest req)
    {
        var accountId = User.FindFirst("sub")?.Value;
        var ok = await _landing.UpdateSectionMetaAsync(id, req.IsActive, req.SortOrder, accountId);
        return ok ? NoContent() : NotFound();
    }

    // PUT /api/cms/landing/sections/{id}/translation/{langCode}
    /// <summary>JSON_MODIFY atomic — tránh race condition khi 2 editor sửa 2 ngôn ngữ đồng thời.</summary>
    [HttpPut("sections/{id}/translation/{langCode}")]
    public async Task<IActionResult> UpdateTranslation(
        string id, string langCode, [FromBody] UpdateContentRequest req)
    {
        var accountId = User.FindFirst("sub")?.Value;
        var (success, error) = await _landing.UpdateTranslationAsync(id, langCode, req.Content, accountId);
        return success ? NoContent() : BadRequest(new { message = error });
    }

    // PUT /api/cms/landing/sections/{id}/shared
    [HttpPut("sections/{id}/shared")]
    public async Task<IActionResult> UpdateShared(string id, [FromBody] UpdateContentRequest req)
    {
        var accountId = User.FindFirst("sub")?.Value;
        var (success, error) = await _landing.UpdateSharedAsync(id, req.Content, accountId);
        return success ? NoContent() : BadRequest(new { message = error });
    }

    // POST /api/cms/landing/upload-image
    [HttpPost("upload-image")]
    [RequestSizeLimit(20_971_520)] // 20MB
    public async Task<IActionResult> UploadImage(IFormFile file, [FromQuery] string? section)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Không có file nào được gửi lên." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not (".jpg" or ".jpeg" or ".png" or ".webp"))
            return BadRequest(new { message = "Chỉ chấp nhận ảnh JPG, PNG, WebP." });

        using var stream = file.OpenReadStream();
        var (url, folderName) = await _landing.UploadImageAsync(stream, file.FileName, file.ContentType, section);
        return Ok(new { url, section = folderName });
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────
public record UpdateMetaRequest(bool IsActive, int SortOrder);

/// <summary>Content JSON serialized as string — đưa thẳng vào JSON_MODIFY.</summary>
public record UpdateContentRequest(string Content);
