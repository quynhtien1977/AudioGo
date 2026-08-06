using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Controllers.Cms;

/// <summary>
/// Quản lý phiên bản APK — Admin only.
/// </summary>
[ApiController]
[Route("api/cms/app-releases")]
[Authorize(Roles = "Admin")]
public class CmsAppReleaseController : ControllerBase
{
    private readonly AppDbContext        _db;
    private readonly IBlobStorageService _blob;
    private readonly ILogger<CmsAppReleaseController> _logger;

    public CmsAppReleaseController(AppDbContext db, IBlobStorageService blob,
        ILogger<CmsAppReleaseController> logger)
    {
        _db     = db;
        _blob   = blob;
        _logger = logger;
    }

    // ── GET /api/cms/app-releases ────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var releases = await _db.AppReleases
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.ReleaseId,
                r.Version,
                r.ApkUrl,
                FileSizeMb = Math.Round(r.FileSizeBytes / 1_048_576.0, 1),
                r.ReleaseNotes,
                r.MinAndroidVersion,
                r.IsLatest,
                r.CreatedAt
            })
            .ToListAsync();

        return Ok(releases);
    }

    // ── POST /api/cms/app-releases ───────────────────────────────────────
    /// <summary>Upload APK mới. Tự động set IsLatest=true và bỏ flag các bản cũ.</summary>
    [HttpPost]
    [RequestSizeLimit(209_715_200)] // 200MB
    public async Task<IActionResult> Upload(
        IFormFile       file,
        [FromForm] string version,
        [FromForm] string? releaseNotes,
        [FromForm] string? minAndroidVersion)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Không có file APK nào được gửi lên." });

        if (!file.FileName.EndsWith(".apk", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Chỉ chấp nhận file .apk." });

        if (string.IsNullOrWhiteSpace(version))
            return BadRequest(new { message = "Phiên bản (version) là bắt buộc." });

        // Upload lên Azure Blob
        var blobName = $"apk/AudioGo-{version.Trim()}.apk";
        using var stream = file.OpenReadStream();
        string apkUrl;
        try
        {
            apkUrl = await _blob.UploadAsync("releases", blobName, stream, "application/vnd.android.package-archive");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi upload APK");
            return StatusCode(500, new { message = "Upload thất bại. Kiểm tra cấu hình Azure Blob." });
        }

        // Bỏ IsLatest của tất cả bản cũ
        await _db.AppReleases
            .Where(r => r.IsLatest)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.IsLatest, false));

        var release = new AppRelease
        {
            Version            = version.Trim(),
            ApkUrl             = apkUrl,
            FileSizeBytes      = file.Length,
            ReleaseNotes       = releaseNotes,
            MinAndroidVersion  = minAndroidVersion ?? "8.0",
            IsLatest           = true,
            CreatedAt          = DateTime.UtcNow,
            CreatedByAccountId = User.FindFirst("sub")?.Value
        };
        _db.AppReleases.Add(release);
        await _db.SaveChangesAsync();

        return Ok(new { release.ReleaseId, release.Version, release.ApkUrl });
    }

    // ── DELETE /api/cms/app-releases/{id} ────────────────────────────────
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var release = await _db.AppReleases.FindAsync(id);
        if (release is null) return NotFound();

        if (release.IsLatest)
            return BadRequest(new { message = "Không thể xóa phiên bản đang là Latest. Hãy upload bản mới trước." });

        // Xóa blob
        try { await _blob.DeleteBlobByUrlAsync(release.ApkUrl); }
        catch { /* bỏ qua nếu blob đã mất */ }

        _db.AppReleases.Remove(release);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
