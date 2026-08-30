using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Security.Claims;

namespace Server.Controllers.Cms;

/// <summary>
/// Quản lý Banner / Event quảng cáo — Admin + Editor.
/// </summary>
[ApiController]
[Route("api/cms/banners")]
[Authorize(Roles = "Admin,Editor")]
public class CmsBannerController : ControllerBase
{
    private readonly IBannerService _banners;
    private readonly ITranslationService _translation;

    public CmsBannerController(IBannerService banners, ITranslationService translation)
    {
        _banners     = banners;
        _translation = translation;
    }

    // GET /api/cms/banners?displayTarget=Landing&isActive=true
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? displayTarget,
        [FromQuery] bool?   isActive)
    {
        var list = await _banners.GetAllAsync(displayTarget, isActive);
        return Ok(list);
    }

    // GET /api/cms/banners/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var banner = await _banners.GetByIdAsync(id);
        return banner is null ? NotFound() : Ok(banner);
    }

    // POST /api/cms/banners
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertBannerRequest req)
    {
        var accountId = User.FindFirst("sub")?.Value
                     ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(req.Title) || string.IsNullOrWhiteSpace(req.ImageUrl))
            return BadRequest(new { message = "Title và ImageUrl là bắt buộc." });

        if (req.DisplayTarget is not ("Landing"))
            return BadRequest(new { message = "DisplayTarget phải là Landing." });

        var created = await _banners.CreateAsync(req, accountId);
        return CreatedAtAction(nameof(GetById), new { id = created.BannerId }, created);
    }

    // PUT /api/cms/banners/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpsertBannerRequest req)
    {
        if (req.DisplayTarget is not ("Landing"))
            return BadRequest(new { message = "DisplayTarget phải là Landing." });

        var (success, error) = await _banners.UpdateAsync(id, req);
        return success ? NoContent() : NotFound(new { message = error });
    }

    // PATCH /api/cms/banners/{id}/toggle
    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> Toggle(string id)
    {
        var ok = await _banners.ToggleActiveAsync(id);
        return ok ? NoContent() : NotFound();
    }

    // DELETE /api/cms/banners/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(string id)
    {
        var ok = await _banners.DeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }

    // POST /api/cms/banners/upload-image
    [HttpPost("upload-image")]
    [RequestSizeLimit(20_971_520)] // 20MB
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Không có file nào được gửi lên." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not (".jpg" or ".jpeg" or ".png" or ".webp"))
            return BadRequest(new { message = "Chỉ chấp nhận ảnh JPG, PNG, WebP." });

        using var stream = file.OpenReadStream();
        var url = await _banners.UploadImageAsync(stream, file.FileName, file.ContentType);
        return Ok(new { url });
    }

    // POST /api/cms/banners/auto-translate
    [HttpPost("auto-translate")]
    public async Task<IActionResult> AutoTranslatePreview([FromBody] TranslateBannerRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { message = "Tiêu đề không được để trống." });

        try
        {
            var titleTranslations = await _translation.TranslateToAllLanguagesAsync(req.Title, "vi");
            Dictionary<string, string>? subtitleTranslations = null;
            if (!string.IsNullOrWhiteSpace(req.Subtitle))
            {
                subtitleTranslations = await _translation.TranslateToAllLanguagesAsync(req.Subtitle, "vi");
            }

            return Ok(new
            {
                titleTranslations,
                subtitleTranslations
            });
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { message = $"Lỗi dịch thuật: {ex.Message}" });
        }
    }

    // POST /api/cms/banners/{id}/auto-translate
    [HttpPost("{id}/auto-translate")]
    public async Task<IActionResult> AutoTranslate(string id)
    {
        var (success, error) = await _banners.AutoTranslateAsync(id);
        if (!success)
            return error == "Không tìm thấy banner."
                ? NotFound(new { message = error })
                : StatusCode(502, new { message = $"Lỗi dịch thuật: {error}" });
        return NoContent();
    }
}
