using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Services.Interfaces;
using System.Text.Json;

namespace Server.Controllers.Cms;

/// <summary>
/// Quản lý nội dung Landing Page — Admin + Editor.
/// </summary>
[ApiController]
[Route("api/cms/landing")]
[Authorize(Roles = "Admin,Editor")]
public class CmsLandingController : ControllerBase
{
    private readonly AppDbContext         _db;
    private readonly IBlobStorageService  _blob;

    public CmsLandingController(AppDbContext db, IBlobStorageService blob)
    {
        _db   = db;
        _blob = blob;
    }

    // ── GET /api/cms/landing/sections ────────────────────────────────────
    [HttpGet("sections")]
    public async Task<IActionResult> GetSections()
    {
        var sections = await _db.LandingSections
            .OrderBy(s => s.SortOrder)
            .Select(s => new
            {
                s.SectionId,
                s.SectionKey,
                s.SortOrder,
                s.IsActive,
                Content     = JsonSerializer.Deserialize<JsonElement>(s.ContentJson),
                s.UpdatedAt,
                s.UpdatedByAccountId
            })
            .ToListAsync();

        return Ok(sections);
    }

    // ── GET /api/cms/landing/sections/{id} ───────────────────────────────
    [HttpGet("sections/{id}")]
    public async Task<IActionResult> GetSection(string id)
    {
        var section = await _db.LandingSections.FindAsync(id);
        if (section is null) return NotFound();

        return Ok(new
        {
            section.SectionId,
            section.SectionKey,
            section.SortOrder,
            section.IsActive,
            Content     = JsonSerializer.Deserialize<JsonElement>(section.ContentJson),
            section.UpdatedAt
        });
    }

    // ── PUT /api/cms/landing/sections/{id} ───────────────────────────────
    [HttpPut("sections/{id}")]
    public async Task<IActionResult> UpdateSection(string id, [FromBody] UpdateSectionRequest req)
    {
        var section = await _db.LandingSections.FindAsync(id);
        if (section is null) return NotFound();

        // Validate ContentJson là JSON hợp lệ
        try
        {
            JsonSerializer.Deserialize<JsonElement>(req.ContentJson);
        }
        catch
        {
            return BadRequest(new { message = "ContentJson không hợp lệ." });
        }

        section.ContentJson        = req.ContentJson;
        section.IsActive           = req.IsActive;
        section.SortOrder          = req.SortOrder;
        section.UpdatedAt          = DateTime.UtcNow;
        section.UpdatedByAccountId = User.FindFirst("sub")?.Value;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── POST /api/cms/landing/upload-image ───────────────────────────────
    [HttpPost("upload-image")]
    [RequestSizeLimit(20_971_520)] // 20MB
    public async Task<IActionResult> UploadImage(IFormFile file, [FromQuery] string? section)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Không có file nào được gửi lên." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not (".jpg" or ".jpeg" or ".png" or ".webp"))
            return BadRequest(new { message = "Chỉ chấp nhận ảnh JPG, PNG, WebP." });

        // Normalize section key để làm tên folder an toàn
        var allowedSections = new[]
        {
            "hero", "stats_bar", "features", "how_it_works",
            "screenshots", "consult_cta", "download_cta", "footer", "logo-app", "general"
        };
        var folderName = allowedSections.Contains(section) ? section! : "general";
        // Chuyển underscore → hyphen cho URL đẹp hơn
        folderName = folderName.Replace("_", "-");

        var blobName = $"landing/{folderName}/{Guid.NewGuid()}{ext}";
        using var stream = file.OpenReadStream();
        var url = await _blob.UploadAsync("media", blobName, stream, file.ContentType);

        return Ok(new { url, section = folderName });
    }
}

public record UpdateSectionRequest(string ContentJson, bool IsActive, int SortOrder);
