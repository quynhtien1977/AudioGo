using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Services.Interfaces;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Server.Controllers.Cms;

/// <summary>
/// Quản lý nội dung Landing Page — Admin + Editor.
///
/// Cấu trúc ContentJson mới (sau i18n migration):
/// {
///   "shared": { /* url ảnh, link, icon, số — không dịch */ },
///   "translations": { "vi": {...}, "en": null, "es": null, "fr": null, "ko": null, "ja": null }
/// }
/// </summary>
[ApiController]
[Route("api/cms/landing")]
[Authorize(Roles = "Admin,Editor")]
public class CmsLandingController : ControllerBase
{
    private readonly AppDbContext        _db;
    private readonly IBlobStorageService _blob;

    private static readonly HashSet<string> AllowedLangs =
        ["vi", "en", "es", "fr", "ko", "ja"];

    public CmsLandingController(AppDbContext db, IBlobStorageService blob)
    {
        _db   = db;
        _blob = blob;
    }

    // ── GET /api/cms/landing/sections ──────────────────────────────────────
    /// <summary>
    /// Trả toàn bộ sections (shared + translations đầy đủ) để CMS hiển thị tất cả tab ngôn ngữ.
    /// </summary>
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
                Content             = JsonSerializer.Deserialize<JsonElement>(s.ContentJson),
                s.UpdatedAt,
                s.UpdatedByAccountId
            })
            .ToListAsync();

        return Ok(sections);
    }

    // ── GET /api/cms/landing/sections/{id} ─────────────────────────────────
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

    // ── PATCH /api/cms/landing/sections/{id}/meta ──────────────────────────
    /// <summary>Cập nhật IsActive và SortOrder (không chạm ContentJson).</summary>
    [HttpPatch("sections/{id}/meta")]
    public async Task<IActionResult> UpdateMeta(string id, [FromBody] UpdateMetaRequest req)
    {
        var section = await _db.LandingSections.FindAsync(id);
        if (section is null) return NotFound();

        section.IsActive  = req.IsActive;
        section.SortOrder = req.SortOrder;
        section.UpdatedAt = DateTime.UtcNow;
        section.UpdatedByAccountId = User.FindFirst("sub")?.Value;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── PUT /api/cms/landing/sections/{id}/translation/{langCode} ──────────
    /// <summary>
    /// Cập nhật translations[langCode] dùng JSON_MODIFY atomic — KHÔNG đọc ContentJson vào C#.
    /// Tránh hoàn toàn race condition khi 2 editor sửa 2 ngôn ngữ đồng thời.
    /// </summary>
    [HttpPut("sections/{id}/translation/{langCode}")]
    public async Task<IActionResult> UpdateTranslation(
        string id, string langCode, [FromBody] UpdateContentRequest req)
    {
        // Validate langCode
        if (!AllowedLangs.Contains(langCode.ToLower()))
            return BadRequest(new { message = $"langCode '{langCode}' không hợp lệ. Chỉ chấp nhận: {string.Join(", ", AllowedLangs)}." });

        langCode = langCode.ToLower();

        // Validate content là JSON object
        if (string.IsNullOrWhiteSpace(req.Content))
            return BadRequest(new { message = "content không được để trống." });

        JsonNode? contentNode;
        try { contentNode = JsonNode.Parse(req.Content); }
        catch { return BadRequest(new { message = "content phải là JSON hợp lệ." }); }

        if (contentNode is not JsonObject contentObj)
            return BadRequest(new { message = "content phải là JSON object." });

        // vi là master — không cho phép lưu trống
        if (langCode == "vi" && contentObj.Count == 0)
            return BadRequest(new { message = "Bản dịch 'vi' (master) không được để trống." });

        // Kiểm tra section tồn tại, nếu chưa có thì tự động tạo (hữu ích cho các section cấu hình mới như navbar)
        var exists = await _db.LandingSections.AnyAsync(s => s.SectionId == id);
        if (!exists)
        {
            _db.LandingSections.Add(new Server.Models.LandingSection
            {
                SectionId = id,
                SectionKey = id.Replace("section-", ""),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                ContentJson = "{}"
            });
            await _db.SaveChangesAsync();
        }

        var accountId = User.FindFirst("sub")?.Value;

        // ✅ JSON_MODIFY atomic — KHÔNG load ContentJson vào C#
        await _db.Database.ExecuteSqlAsync(
            $"""
            UPDATE LandingSection
            SET ContentJson = JSON_MODIFY(ContentJson, {$"$.translations.{langCode}"}, JSON_QUERY({req.Content})),
                UpdatedAt   = SYSUTCDATETIME(),
                UpdatedByAccountId = {accountId}
            WHERE SectionId = {id}
            """);

        return NoContent();
    }

    // ── PUT /api/cms/landing/sections/{id}/shared ──────────────────────────
    /// <summary>
    /// Cập nhật shared fields (ảnh, link, icon...) dùng JSON_MODIFY atomic.
    /// </summary>
    [HttpPut("sections/{id}/shared")]
    public async Task<IActionResult> UpdateShared(
        string id, [FromBody] UpdateContentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Content))
            return BadRequest(new { message = "content không được để trống." });

        try { JsonNode.Parse(req.Content); }
        catch { return BadRequest(new { message = "content phải là JSON hợp lệ." }); }

        var exists = await _db.LandingSections.AnyAsync(s => s.SectionId == id);
        if (!exists)
        {
            _db.LandingSections.Add(new Server.Models.LandingSection
            {
                SectionId = id,
                SectionKey = id.Replace("section-", ""),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                ContentJson = "{}"
            });
            await _db.SaveChangesAsync();
        }

        var accountId = User.FindFirst("sub")?.Value;

        await _db.Database.ExecuteSqlAsync(
            $"""
            UPDATE LandingSection
            SET ContentJson = JSON_MODIFY(ContentJson, '$.shared', JSON_QUERY({req.Content})),
                UpdatedAt   = SYSUTCDATETIME(),
                UpdatedByAccountId = {accountId}
            WHERE SectionId = {id}
            """);

        return NoContent();
    }

    // ── POST /api/cms/landing/upload-image ─────────────────────────────────
    [HttpPost("upload-image")]
    [RequestSizeLimit(20_971_520)] // 20MB
    public async Task<IActionResult> UploadImage(IFormFile file, [FromQuery] string? section)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Không có file nào được gửi lên." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not (".jpg" or ".jpeg" or ".png" or ".webp"))
            return BadRequest(new { message = "Chỉ chấp nhận ảnh JPG, PNG, WebP." });

        var allowedSections = new[]
        {
            "hero", "stats_bar", "features", "how_it_works",
            "screenshots", "consult_cta", "download_cta", "footer", "logo-app", "general"
        };
        var folderName = allowedSections.Contains(section) ? section! : "general";
        folderName = folderName.Replace("_", "-");

        var blobName = $"landing/{folderName}/{Guid.NewGuid()}{ext}";
        using var stream = file.OpenReadStream();
        var url = await _blob.UploadAsync("media", blobName, stream, file.ContentType);

        return Ok(new { url, section = folderName });
    }
}

// ── DTOs ────────────────────────────────────────────────────────────────────
public record UpdateMetaRequest(bool IsActive, int SortOrder);

/// <summary>Content JSON serialized as string — sẽ được đưa thẳng vào JSON_MODIFY.</summary>
public record UpdateContentRequest(string Content);
