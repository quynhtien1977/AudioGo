using Microsoft.AspNetCore.Mvc;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Controllers.Mobile;

/// <summary>
/// Public endpoints cho mobile app và landing page:
///   - Lấy banner đang active theo target (no auth)
///   - Lấy config giá / duration (no auth)
/// </summary>
[ApiController]
[Route("api/mobile")]
public class MobilePublicController : ControllerBase
{
    private readonly IBannerService     _banners;
    private readonly IAppSettingService _settings;

    public MobilePublicController(IBannerService banners, IAppSettingService settings)
    {
        _banners  = banners;
        _settings = settings;
    }

    /// <summary>
    /// GET /api/mobile/banners?target=MobileHome
    /// GET /api/mobile/banners?target=Landing
    /// Trả về danh sách banner đang active, lọc theo target và date range.
    /// Public — không cần JWT.
    /// </summary>
    [HttpGet("banners")]
    public async Task<IActionResult> GetBanners([FromQuery] string target = "MobileHome")
    {
        if (target is not ("MobileHome" or "Landing" or "Both"))
            return BadRequest(new { message = "target phải là MobileHome, Landing hoặc Both." });

        var banners = await _banners.GetActiveByTargetAsync(target);
        return Ok(banners);
    }

    /// <summary>
    /// GET /api/mobile/config
    /// Trả về giá vào app và số ngày hiệu lực.
    /// App gọi khi khởi động để hiển thị đúng giá trên màn hình thanh toán.
    /// Public — không cần JWT.
    /// </summary>
    [HttpGet("config")]
    public async Task<IActionResult> GetConfig()
    {
        var priceVnd              = await _settings.GetAsync("TouristAccess.PriceVnd",            10_000m);
        var touristDuration       = await _settings.GetAsync("TouristAccess.DurationDays",        7);
        var accessCodeDuration    = await _settings.GetAsync("AppAccessCode.DefaultDurationDays", 7);

        return Ok(new MobileConfigDto(priceVnd, touristDuration, accessCodeDuration));
    }
}
