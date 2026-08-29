using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Security.Claims;

namespace Server.Controllers.Cms;

/// <summary>
/// Quản lý AppSetting (cấu hình động) — Admin only.
/// Public endpoint /api/mobile/config nằm ở MobileConfigController.
/// </summary>
[ApiController]
[Route("api/cms/settings")]
[Authorize(Roles = "Admin")]
public class CmsAppSettingController : ControllerBase
{
    private readonly IAppSettingService _settings;

    public CmsAppSettingController(IAppSettingService settings) => _settings = settings;

    // GET /api/cms/settings
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _settings.GetAllAsync();
        return Ok(list);
    }

    // PUT /api/cms/settings/{key}
    [HttpPut("{key}")]
    public async Task<IActionResult> Upsert(string key, [FromBody] UpdateSettingRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Value))
            return BadRequest(new { message = "Value không được để trống." });

        var accountId = User.FindFirst("sub")?.Value
                     ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        await _settings.UpsertAsync(key, req.Value, accountId);
        return NoContent();
    }
}
