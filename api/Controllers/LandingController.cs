using Microsoft.AspNetCore.Mvc;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Controllers;

/// <summary>
/// Public API — không cần JWT.
/// Cung cấp nội dung landing page và thông tin APK mới nhất.
/// Mọi business logic và DB access đã được delegate sang ILandingService.
/// </summary>
[ApiController]
[Route("api")]
public class LandingController : ControllerBase
{
    private readonly ILandingService _landing;

    public LandingController(ILandingService landing)
    {
        _landing = landing;
    }

    // GET /api/landing/sections?lang=vi
    [HttpGet("landing/sections")]
    [HttpGet("landing")] // backward compat
    public async Task<IActionResult> GetLanding([FromQuery] string? lang = "vi")
    {
        var result = await _landing.GetPublicLandingAsync(lang ?? "vi");
        return Ok(result);
    }

    // GET /api/app/latest
    [HttpGet("app/latest")]
    public async Task<IActionResult> GetLatestApp()
    {
        var release = await _landing.GetLatestAppAsync();
        return release is null
            ? NotFound(new { message = "Chưa có phiên bản APK nào được phát hành." })
            : Ok(release);
    }

    // POST /api/landing/consult
    [HttpPost("landing/consult")]
    public async Task<IActionResult> SubmitConsultation([FromBody] ConsultationFormDto req)
    {
        var (success, error) = await _landing.SubmitConsultationAsync(req);
        return success
            ? Ok(new { message = "Yêu cầu của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ trong 24 giờ!" })
            : BadRequest(new { message = error });
    }
}
