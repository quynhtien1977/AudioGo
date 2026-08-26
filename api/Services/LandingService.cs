using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Server.Services
{
    /// <summary>
    /// Triển khai toàn bộ business logic Landing Page, tách ra khỏi CmsLandingController và LandingController.
    /// </summary>
    public class LandingService : ILandingService
    {
        private readonly AppDbContext       _db;
        private readonly IBlobStorageService _blob;
        private readonly IEmailService      _email;
        private readonly IConfiguration    _config;

        private static readonly HashSet<string> AllowedLangs =
            ["vi", "en", "es", "fr", "ko", "ja"];

        private static readonly string[] AllowedSections =
            ["hero", "stats_bar", "features", "how_it_works",
             "screenshots", "consult_cta", "download_cta", "footer", "logo-app", "general"];

        public LandingService(
            AppDbContext db,
            IBlobStorageService blob,
            IEmailService email,
            IConfiguration config)
        {
            _db     = db;
            _blob   = blob;
            _email  = email;
            _config = config;
        }

        // ─────────────────────────────────────────────────────────────────────
        // CMS — GetAllSections
        // ─────────────────────────────────────────────────────────────────────
        public async Task<List<LandingSectionDto>> GetAllSectionsAsync()
        {
            return await _db.LandingSections
                .OrderBy(s => s.SortOrder)
                .Select(s => new LandingSectionDto(
                    s.SectionId,
                    s.SectionKey,
                    s.SortOrder,
                    s.IsActive,
                    JsonSerializer.Deserialize<JsonElement>(s.ContentJson),
                    s.UpdatedAt,
                    s.UpdatedByAccountId))
                .ToListAsync();
        }

        // ─────────────────────────────────────────────────────────────────────
        // CMS — GetSectionById
        // ─────────────────────────────────────────────────────────────────────
        public async Task<LandingSectionDto?> GetSectionByIdAsync(string id)
        {
            var s = await _db.LandingSections.FindAsync(id);
            if (s is null) return null;

            return new LandingSectionDto(
                s.SectionId,
                s.SectionKey,
                s.SortOrder,
                s.IsActive,
                JsonSerializer.Deserialize<JsonElement>(s.ContentJson),
                s.UpdatedAt);
        }

        // ─────────────────────────────────────────────────────────────────────
        // CMS — UpdateSectionMeta (IsActive + SortOrder)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<bool> UpdateSectionMetaAsync(string id, bool isActive, int sortOrder, string? accountId)
        {
            var section = await _db.LandingSections.FindAsync(id);
            if (section is null) return false;

            section.IsActive           = isActive;
            section.SortOrder          = sortOrder;
            section.UpdatedAt          = DateTime.UtcNow;
            section.UpdatedByAccountId = accountId;

            await _db.SaveChangesAsync();
            return true;
        }

        // ─────────────────────────────────────────────────────────────────────
        // CMS — UpdateTranslation (JSON_MODIFY atomic)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<(bool Success, string? Error)> UpdateTranslationAsync(
            string id, string langCode, string content, string? accountId)
        {
            langCode = langCode.ToLower();

            if (!AllowedLangs.Contains(langCode))
                return (false, $"langCode '{langCode}' không hợp lệ. Chỉ chấp nhận: {string.Join(", ", AllowedLangs)}.");

            if (string.IsNullOrWhiteSpace(content))
                return (false, "content không được để trống.");

            JsonNode? contentNode;
            try { contentNode = JsonNode.Parse(content); }
            catch { return (false, "content phải là JSON hợp lệ."); }

            if (contentNode is not JsonObject contentObj)
                return (false, "content phải là JSON object.");

            if (langCode == "vi" && contentObj.Count == 0)
                return (false, "Bản dịch 'vi' (master) không được để trống.");

            await EnsureSectionExistsAsync(id);

            // JSON_MODIFY atomic — không đọc ContentJson vào C#, tránh race condition
            await _db.Database.ExecuteSqlAsync(
                $"""
                UPDATE LandingSection
                SET ContentJson = JSON_MODIFY(ContentJson, {$"$.translations.{langCode}"}, JSON_QUERY({content})),
                    UpdatedAt   = SYSUTCDATETIME(),
                    UpdatedByAccountId = {accountId}
                WHERE SectionId = {id}
                """);

            return (true, null);
        }

        // ─────────────────────────────────────────────────────────────────────
        // CMS — UpdateShared (JSON_MODIFY atomic)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<(bool Success, string? Error)> UpdateSharedAsync(
            string id, string content, string? accountId)
        {
            if (string.IsNullOrWhiteSpace(content))
                return (false, "content không được để trống.");

            try { JsonNode.Parse(content); }
            catch { return (false, "content phải là JSON hợp lệ."); }

            await EnsureSectionExistsAsync(id);

            await _db.Database.ExecuteSqlAsync(
                $"""
                UPDATE LandingSection
                SET ContentJson = JSON_MODIFY(ContentJson, '$.shared', JSON_QUERY({content})),
                    UpdatedAt   = SYSUTCDATETIME(),
                    UpdatedByAccountId = {accountId}
                WHERE SectionId = {id}
                """);

            return (true, null);
        }

        // ─────────────────────────────────────────────────────────────────────
        // CMS — UploadImage
        // ─────────────────────────────────────────────────────────────────────
        public async Task<(string Url, string FolderName)> UploadImageAsync(
            Stream stream, string fileName, string contentType, string? sectionHint)
        {
            var folderName = AllowedSections.Contains(sectionHint) ? sectionHint! : "general";
            folderName = folderName.Replace("_", "-");

            var ext      = Path.GetExtension(fileName).ToLowerInvariant();
            var blobName = $"landing/{folderName}/{Guid.NewGuid()}{ext}";
            var url      = await _blob.UploadAsync("media", blobName, stream, contentType);

            return (url, folderName);
        }

        // ─────────────────────────────────────────────────────────────────────
        // Public — GetPublicLanding (merge shared + translations → flat)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<List<object>> GetPublicLandingAsync(string lang = "vi")
        {
            var resolvedLang = (lang?.ToLower() is { } l && AllowedLangs.Contains(l)) ? l : "vi";

            var rows = await _db.LandingSections
                .Where(s => s.IsActive)
                .OrderBy(s => s.SortOrder)
                .Select(s => new { s.SectionId, s.SectionKey, s.SortOrder, s.ContentJson })
                .ToListAsync();

            return rows.Select(s =>
            {
                JsonNode? merged = MergeContent(s.ContentJson, resolvedLang);
                return (object)new
                {
                    s.SectionId,
                    s.SectionKey,
                    s.SortOrder,
                    Content = merged is null
                        ? JsonSerializer.Deserialize<JsonElement>("{}")
                        : JsonSerializer.Deserialize<JsonElement>(merged.ToJsonString())
                };
            }).ToList();
        }

        // ─────────────────────────────────────────────────────────────────────
        // Public — GetLatestApp
        // ─────────────────────────────────────────────────────────────────────
        public async Task<LatestAppReleaseDto?> GetLatestAppAsync()
        {
            return await _db.AppReleases
                .Where(r => r.IsLatest)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new LatestAppReleaseDto(
                    r.ReleaseId,
                    r.Version,
                    r.ApkUrl,
                    Math.Round(r.FileSizeBytes / 1_048_576.0, 1),
                    r.ReleaseNotes,
                    r.MinAndroidVersion,
                    r.CreatedAt))
                .FirstOrDefaultAsync();
        }

        // ─────────────────────────────────────────────────────────────────────
        // Public — SubmitConsultation
        // ─────────────────────────────────────────────────────────────────────
        public async Task<(bool Success, string? Error)> SubmitConsultationAsync(ConsultationFormDto req)
        {
            if (string.IsNullOrWhiteSpace(req.FullName) ||
                string.IsNullOrWhiteSpace(req.RestaurantName) ||
                string.IsNullOrWhiteSpace(req.PhoneNumber) ||
                string.IsNullOrWhiteSpace(req.Email))
                return (false, "Vui lòng điền đầy đủ thông tin bắt buộc (bao gồm email).");

            if (!req.Email.Contains('@') || !req.Email.Contains('.'))
                return (false, "Email không hợp lệ.");

            var phone = req.PhoneNumber.Trim().Replace(" ", "");
            if (phone.Length != 10 || !phone.StartsWith("0") || !phone.All(char.IsDigit))
                return (false, "Số điện thoại không hợp lệ (cần 10 chữ số, bắt đầu bằng 0).");

            var entity = new ConsultationRequest
            {
                FullName       = req.FullName.Trim(),
                RestaurantName = req.RestaurantName.Trim(),
                PhoneNumber    = phone,
                Area           = string.IsNullOrWhiteSpace(req.Area) ? "Vĩnh Khánh Q4" : req.Area.Trim(),
                Email          = req.Email.Trim(),
                Message        = req.Message?.Trim(),
                Status         = "New",
                CreatedAt      = DateTime.UtcNow
            };
            _db.ConsultationRequests.Add(entity);
            await _db.SaveChangesAsync();

            // Gửi email thông báo cho Admin — không để lỗi email ảnh hưởng response
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
                catch { /* đã lưu DB là đủ */ }
            }

            return (true, null);
        }

        // ── Private Helpers ───────────────────────────────────────────────────

        /// <summary>Tạo section mới với ContentJson rỗng nếu chưa tồn tại.</summary>
        private async Task EnsureSectionExistsAsync(string id)
        {
            var exists = await _db.LandingSections.AnyAsync(s => s.SectionId == id);
            if (!exists)
            {
                _db.LandingSections.Add(new LandingSection
                {
                    SectionId   = id,
                    SectionKey  = id.Replace("section-", ""),
                    IsActive    = true,
                    CreatedAt   = DateTime.UtcNow,
                    ContentJson = "{}"
                });
                await _db.SaveChangesAsync();
            }
        }

        /// <summary>Merge shared + translations[lang] → flat JsonObject. Fallback về "vi".</summary>
        private static JsonNode? MergeContent(string contentJson, string lang)
        {
            JsonNode? root;
            try { root = JsonNode.Parse(contentJson); }
            catch { return null; }

            if (root is not JsonObject obj) return root;

            // Format cũ chưa migrate → trả nguyên
            if (obj["translations"] == null) return root;

            var shared       = obj["shared"]?.AsObject() ?? new JsonObject();
            var translations = obj["translations"]?.AsObject();

            JsonObject? trans = null;
            if (translations?[lang] is JsonObject requested && requested.Count > 0)
                trans = requested;
            else if (translations?["vi"] is JsonObject vi)
                trans = vi;

            var merged = new JsonObject();
            if (shared != null)
                foreach (var (k, v) in shared)
                    merged[k] = v?.DeepClone();
            if (trans != null)
                MergeDeep(merged, trans);

            return merged;
        }

        /// <summary>Deep merge src vào dest — array fields merge theo index.</summary>
        private static void MergeDeep(JsonObject dest, JsonObject src)
        {
            foreach (var (key, srcVal) in src)
            {
                if (srcVal is JsonArray srcArr && dest[key] is JsonArray destArr)
                {
                    var mergedArr = new JsonArray();
                    var len = Math.Max(srcArr.Count, destArr.Count);
                    for (int i = 0; i < len; i++)
                    {
                        var destItem  = i < destArr.Count ? destArr[i]?.AsObject() : null;
                        var srcItem   = i < srcArr.Count  ? srcArr[i]?.AsObject()  : null;
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
    }
}
