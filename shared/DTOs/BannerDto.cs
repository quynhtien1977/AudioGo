namespace Shared.DTOs;

// ── Banner DTOs ───────────────────────────────────────────────────────────────

/// <summary>Banner đầy đủ — dùng trong CMS list/edit và public API mobile/landing.</summary>
public record BannerDto(
    string   BannerId,
    string   Title,
    string?  Subtitle,
    string   ImageUrl,
    string?  LinkUrl,
    string   DisplayTarget,
    DateTime? StartDate,
    DateTime? EndDate,
    bool     IsActive,
    int      SortOrder,
    string?  TitleTranslations,
    string?  SubtitleTranslations,
    string?  CreatedByAccountId,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

/// <summary>Request tạo hoặc cập nhật banner.</summary>
public record UpsertBannerRequest(
    string   Title,
    string?  Subtitle,
    string   ImageUrl,
    string?  LinkUrl,
    string   DisplayTarget,   // "Landing" 
    DateTime? StartDate,
    DateTime? EndDate,
    bool     IsActive,
    int      SortOrder,
    string?  TitleTranslations = null,
    string?  SubtitleTranslations = null
);

/// <summary>Request dịch tự động tiêu đề và phụ đề banner sang 6 ngôn ngữ.</summary>
public record TranslateBannerRequest(string Title, string? Subtitle);

// ── AppSetting DTOs ───────────────────────────────────────────────────────────

/// <summary>Setting item — dùng trong CMS settings page.</summary>
public record AppSettingDto(
    string   SettingKey,
    string   SettingValue,
    string   DataType,
    string?  Description,
    DateTime? UpdatedAt,
    string?  UpdatedByAccountId
);

/// <summary>Request Admin update 1 setting.</summary>
public record UpdateSettingRequest(string Value);

/// <summary>Public config trả cho mobile app — chỉ expose giá trị cần thiết.</summary>
public record MobileConfigDto(
    decimal PriceVnd,
    int     TouristDurationDays,
    int     AccessCodeDurationDays
);
