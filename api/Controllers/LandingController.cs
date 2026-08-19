using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;
using System.Text.Json;
using System.Text.Json.Nodes;

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

    private static readonly HashSet<string> AllowedLangs =
        ["vi", "en", "es", "fr", "ko", "ja"];

    public LandingController(AppDbContext db, IEmailService email, IConfiguration config)
    {
        _db     = db;
        _email  = email;
        _config = config;
    }

    // ── GET /api/landing/sections?lang=vi ────────────────────────────────
    /// <summary>
    /// Trả về toàn bộ section đang active, merge shared + translations[lang] thành object phẳng.
    /// Fallback: nếu translations[lang] == null → dùng translations["vi"].
    /// </summary>
    [HttpGet("landing/sections")]
    [HttpGet("landing")] // backward compat
    public async Task<IActionResult> GetLanding([FromQuery] string? lang = "vi")
    {
        var resolvedLang = (lang?.ToLower() is { } l && AllowedLangs.Contains(l)) ? l : "vi";

        var rows = await _db.LandingSections
            .Where(s => s.IsActive)
            .OrderBy(s => s.SortOrder)
            .Select(s => new { s.SectionId, s.SectionKey, s.SortOrder, s.ContentJson })
            .ToListAsync();

        var result = rows.Select(s =>
        {
            JsonNode? merged = MergeContent(s.ContentJson, resolvedLang);
            return new
            {
                s.SectionId,
                s.SectionKey,
                s.SortOrder,
                Content = merged is null
                    ? (object)JsonSerializer.Deserialize<JsonElement>("{}")
                    : JsonSerializer.Deserialize<JsonElement>(merged.ToJsonString())
            };
        });

        return Ok(result);
    }

    /// <summary>
    /// Merge shared + translations[lang] → object phẳng.
    /// Nếu translations[lang] == null, fallback về "vi".
    /// Nếu ContentJson vẫn là format cũ (không có "translations") → trả nguyên.
    /// </summary>
    private static JsonNode? MergeContent(string contentJson, string lang)
    {
        JsonNode? root;
        try { root = JsonNode.Parse(contentJson); }
        catch { return null; }

        if (root is not JsonObject obj) return root;

        // Format cũ chưa migrate → trả nguyên
        if (obj["translations"] == null) return root;

        var shared = obj["shared"]?.AsObject() ?? new JsonObject();
        var translations = obj["translations"]?.AsObject();

        JsonObject? trans = null;
        // Thử lang được yêu cầu
        if (translations?[lang] is JsonObject requested && requested.Count > 0)
            trans = requested;
        // Fallback về vi
        else if (translations?["vi"] is JsonObject vi)
            trans = vi;

        // Merge: bắt đầu từ shared, overlay translations
        var merged = new JsonObject();
        if (shared != null)
            foreach (var (k, v) in shared)
                merged[k] = v?.DeepClone();
        if (trans != null)
            MergeDeep(merged, trans);

        return merged;
    }

    /// <summary>Deep merge src vào dest — với array fields (items, steps, images, stats):
    /// merge từng phần tử theo index (shared items + trans items → merged items).</summary>
    private static void MergeDeep(JsonObject dest, JsonObject src)
    {
        foreach (var (key, srcVal) in src)
        {
            if (srcVal is JsonArray srcArr && dest[key] is JsonArray destArr)
            {
                // Merge arrays element-by-element
                var mergedArr = new JsonArray();
                var len = Math.Max(srcArr.Count, destArr.Count);
                for (int i = 0; i < len; i++)
                {
                    var destItem = i < destArr.Count ? destArr[i]?.AsObject() : null;
                    var srcItem  = i < srcArr.Count  ? srcArr[i]?.AsObject()  : null;
                    var mergedItem = new JsonObject();
                    if (destItem != null)
                        foreach (var (k, v) in destItem) mergedItem[k] = v?.DeepClone();
                    if (srcItem != null)
                        foreach (var (k, v) in srcItem) mergedItem[k] = v?.DeepClone();
                    mergedArr.Add(mergedItem);
                }
                dest[key] = mergedArr;
            }
            else
            {
                dest[key] = srcVal?.DeepClone();
            }
        }
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
