using System.Text.Json;

namespace Shared.DTOs
{
    /// <summary>DTO section landing page, ContentJson được deserialize sẵn cho client.</summary>
    public record LandingSectionDto(
        string      SectionId,
        string      SectionKey,
        int         SortOrder,
        bool        IsActive,
        JsonElement Content,
        DateTime?   UpdatedAt,
        string?     UpdatedByAccountId = null);

    /// <summary>DTO APK release mới nhất.</summary>
    public record LatestAppReleaseDto(
        string  ReleaseId,
        string  Version,
        string  ApkUrl,
        double  FileSizeMb,
        string? ReleaseNotes,
        string? MinAndroidVersion,
        DateTime CreatedAt);

    /// <summary>DTO nhận từ form tư vấn landing page.</summary>
    public record ConsultationFormDto(
        string  FullName,
        string  RestaurantName,
        string  PhoneNumber,
        string? Area,
        string  Email,
        string? Message);
}
