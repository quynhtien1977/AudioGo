using Microsoft.AspNetCore.Mvc;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Controllers.Mobile;

/// <summary>
/// Public endpoints cho mobile app và landing page:
///   - Lấy banner đang active theo target (no auth)
///   - Lấy config giá / duration (no auth)
///   - Lấy cảnh báo hệ thống mới nhất (no auth)
/// </summary>
[ApiController]
[Route("api/mobile")]
public class MobilePublicController : ControllerBase
{
    private readonly IBannerService       _banners;
    private readonly IAppSettingService   _settings;
    private readonly INotificationService _notifications;

    public MobilePublicController(
        IBannerService       banners,
        IAppSettingService   settings,
        INotificationService notifications)
    {
        _banners       = banners;
        _settings      = settings;
        _notifications = notifications;
    }

    /// <summary>
    /// GET /api/mobile/banners
    /// Trả về danh sách banner đang active của Landing Page.
    /// Public — không cần JWT.
    /// </summary>
    [HttpGet("banners")]
    public async Task<IActionResult> GetBanners()
    {
        var banners = await _banners.GetActiveByTargetAsync("Landing");
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

    /// <summary>
    /// GET /api/mobile/system-alert
    /// Trả về cảnh báo hệ thống mới nhất (Public broadcast).
    /// Mobile dùng khi khởi động để hiện banner cảnh báo vận hành ngắn hạn.
    /// Public — không cần JWT.
    /// </summary>
    [HttpGet("system-alert")]
    public async Task<IActionResult> GetSystemAlert()
    {
        var alerts = await _notifications.GetPublicBroadcastsAsync();
        var latest = alerts.FirstOrDefault();
        return Ok(latest); // null → 200 với body "null" — client check null
    }
}
