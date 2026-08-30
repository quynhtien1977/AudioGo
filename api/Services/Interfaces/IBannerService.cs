using Shared.DTOs;

namespace Server.Services.Interfaces;

public interface IBannerService
{
    // ── CMS ───────────────────────────────────────────────────────────────────
    Task<List<BannerDto>> GetAllAsync(string? displayTarget = null, bool? isActive = null);
    Task<BannerDto?> GetByIdAsync(string bannerId);
    Task<BannerDto> CreateAsync(UpsertBannerRequest req, string? createdByAccountId);
    Task<(bool Success, string? Error)> UpdateAsync(string bannerId, UpsertBannerRequest req);
    Task<bool> DeleteAsync(string bannerId);
    Task<bool> ToggleActiveAsync(string bannerId);
    Task<string> UploadImageAsync(Stream stream, string fileName, string contentType);

    // ── Public / Mobile ───────────────────────────────────────────────────────
    /// <summary>Chỉ trả banner IsActive và còn trong date range — dùng cho mobile/landing.</summary>
    Task<List<BannerDto>> GetActiveByTargetAsync(string displayTarget);

    /// <summary>Dịch tự động tiêu đề và phụ đề của 1 banner sang 6 ngôn ngữ, lưu vào DB.</summary>
    Task<(bool Success, string? Error)> AutoTranslateAsync(string bannerId);
}
