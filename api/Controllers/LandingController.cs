using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;
using System.Text.Json;

namespace Server.Controllers;

/// <summary>
/// Public API — không cần JWT.
/// Cung cấp nội dung landing page và thông tin APK mới nhất.
/// </summary>
[ApiController]
[Route("api")]
public class LandingController : ControllerBase
{
    private readonly AppDbContext   _db;
    private readonly IEmailService  _email;
    private readonly IConfiguration _config;

    public LandingController(AppDbContext db, IEmailService email, IConfiguration config)
    {
        _db     = db;
        _email  = email;
        _config = config;
    }

    // ── GET /api/landing ──────────────────────────────────────────────────
    /// <summary>Trả về toàn bộ section đang active, sắp theo SortOrder.</summary>
    [HttpGet("landing")]
    public async Task<IActionResult> GetLanding()
    {
        var sections = await _db.LandingSections
            .Where(s => s.IsActive)
            .OrderBy(s => s.SortOrder)
            .Select(s => new
            {
                s.SectionId,
                s.SectionKey,
                s.SortOrder,
                // Parse ContentJson sang object để trả JSON thuần (không bị double-escaped)
                Content = JsonSerializer.Deserialize<JsonElement>(s.ContentJson)
            })
            .ToListAsync();

        return Ok(sections);
    }

    // ── GET /api/app/latest ───────────────────────────────────────────────
    /// <summary>Trả về phiên bản APK mới nhất đang IsLatest=true.</summary>
    [HttpGet("app/latest")]
    public async Task<IActionResult> GetLatestApp()
    {
        var release = await _db.AppReleases
            .Where(r => r.IsLatest)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.ReleaseId,
                r.Version,
                r.ApkUrl,
                FileSizeMb       = Math.Round(r.FileSizeBytes / 1_048_576.0, 1),
                r.ReleaseNotes,
                r.MinAndroidVersion,
                r.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (release is null)
            return NotFound(new { message = "Chưa có phiên bản APK nào được phát hành." });

        return Ok(release);
    }

    // ── POST /api/landing/consult ─────────────────────────────────────────
    /// <summary>Nhận form tư vấn từ chủ quán tiềm năng.</summary>
    [HttpPost("landing/consult")]
    public async Task<IActionResult> SubmitConsultation([FromBody] ConsultationFormRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FullName) ||
            string.IsNullOrWhiteSpace(req.RestaurantName) ||
            string.IsNullOrWhiteSpace(req.PhoneNumber) ||
            string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { message = "Vui lòng điền đầy đủ thông tin bắt buộc (bao gồm email)." });

        // Validate email cơ bản
        if (!req.Email!.Contains('@') || !req.Email.Contains('.'))
            return BadRequest(new { message = "Email không hợp lệ." });

        // Validate SĐT 10 chữ số Việt Nam
        var phone = req.PhoneNumber.Trim().Replace(" ", "");
        if (phone.Length != 10 || !phone.StartsWith("0") || !phone.All(char.IsDigit))
            return BadRequest(new { message = "Số điện thoại không hợp lệ (cần 10 chữ số, bắt đầu bằng 0)." });

        // Lưu vào DB
        var entity = new ConsultationRequest
        {
            FullName       = req.FullName.Trim(),
            RestaurantName = req.RestaurantName.Trim(),
            PhoneNumber    = phone,
            Area           = string.IsNullOrWhiteSpace(req.Area) ? "Vĩnh Khánh Q4" : req.Area.Trim(),
            Email          = req.Email?.Trim(),
            Message        = req.Message?.Trim(),
            Status         = "New",
            CreatedAt      = DateTime.UtcNow
        };
        _db.ConsultationRequests.Add(entity);
        await _db.SaveChangesAsync();

        // Gửi email thông báo cho Admin
        var adminEmail = _config["ADMIN_CONTACT_EMAIL"];
        if (!string.IsNullOrEmpty(adminEmail))
        {
            try
            {
                await _email.SendConsultationNotificationAsync(
                    adminEmail,
                    entity.FullName,
                    entity.RestaurantName,
                    entity.PhoneNumber,
                    entity.Email,
                    entity.Area,
                    entity.Message);
            }
            catch
            {
                // Không để lỗi email ảnh hưởng response — đã lưu DB là đủ
            }
        }

        return Ok(new { message = "Yêu cầu của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ trong 24 giờ!" });
    }
}

/// <summary>DTO nhận từ form tư vấn landing page.</summary>
public record ConsultationFormRequest(
    string  FullName,
    string  RestaurantName,
    string  PhoneNumber,
    string? Area,
    string  Email,       // bắt buộc
    string? Message
);
