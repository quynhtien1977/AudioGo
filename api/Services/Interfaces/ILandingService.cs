using System.Text.Json;
using System.Text.Json.Nodes;
using Shared.DTOs;

namespace Server.Services.Interfaces
{
    /// <summary>
    /// Tách toàn bộ business logic của Landing Page ra khỏi controller.
    /// Bao gồm: đọc/ghi section, merge i18n content, upload ảnh, form tư vấn.
    /// </summary>
    public interface ILandingService
    {
        // ── CMS (Admin/Editor) ────────────────────────────────────────────────

        /// <summary>Lấy tất cả sections, trả nguyên ContentJson để CMS hiển thị tất cả ngôn ngữ.</summary>
        Task<List<LandingSectionDto>> GetAllSectionsAsync();

        /// <summary>Lấy một section theo ID.</summary>
        Task<LandingSectionDto?> GetSectionByIdAsync(string id);

        /// <summary>Cập nhật IsActive và SortOrder của một section.</summary>
        Task<bool> UpdateSectionMetaAsync(string id, bool isActive, int sortOrder, string? accountId);

        /// <summary>
        /// Cập nhật translations[langCode] dùng JSON_MODIFY atomic.
        /// Tự tạo section nếu chưa tồn tại.
        /// Trả về (success, errorMessage).
        /// </summary>
        Task<(bool Success, string? Error)> UpdateTranslationAsync(string id, string langCode, string content, string? accountId);

        /// <summary>
        /// Cập nhật shared fields (ảnh, link, icon) dùng JSON_MODIFY atomic.
        /// Tự tạo section nếu chưa tồn tại.
        /// Trả về (success, errorMessage).
        /// </summary>
        Task<(bool Success, string? Error)> UpdateSharedAsync(string id, string content, string? accountId);

        /// <summary>Upload ảnh landing page lên blob storage. Trả về URL.</summary>
        Task<(string Url, string FolderName)> UploadImageAsync(Stream stream, string fileName, string contentType, string? sectionHint);

        // ── Public API ────────────────────────────────────────────────────────

        /// <summary>
        /// Trả về tất cả sections đang active, merge shared + translations[lang] → flat object.
        /// Fallback về "vi" nếu lang không có dữ liệu.
        /// </summary>
        Task<List<object>> GetPublicLandingAsync(string lang = "vi");

        /// <summary>Lấy APK release mới nhất (IsLatest = true).</summary>
        Task<LatestAppReleaseDto?> GetLatestAppAsync();

        /// <summary>
        /// Xử lý form tư vấn: validate, lưu DB, gửi email Admin.
        /// Trả về (success, errorMessage).
        /// </summary>
        Task<(bool Success, string? Error)> SubmitConsultationAsync(ConsultationFormDto req);
    }
}
