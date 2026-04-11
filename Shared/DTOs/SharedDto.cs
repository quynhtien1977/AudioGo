namespace Shared.DTOs
{
    // ── Analytics ────────────────────────────────────────────────────────
    public record TopPoiDto(
        string PoiId,
        string Title,
        int ListenCount,
        string Category
    );

    public record HeatmapPointDto(
        double Latitude,
        double Longitude,
        int Count
    );

    // ── Category ────────────────────────────────────────────────────────
    public record CategoryDto(
        string CategoryId,
        string Name,
        int PoiCount,           // Mới thêm: Cho mobile hiển thị số lượng
        DateTime CreatedAt,     // Cũ: CMS cần
        DateTime UpdatedAt      // Cũ: CMS cần
    );

    public record CategoryCreateRequest(string Name);

    // ── Tour ────────────────────────────────────────────────────────────
    /// <summary>Summary gọn cho Mobile (không cần Pois list).</summary>
    public record TourSummaryDto(
        string TourId,
        string Name,
        string Description,
        int PoiCount,
        string? ThumbnailUrl,
        DateTime CreatedAt
    );

    /// <summary>Full DTO cho CMS (có Pois list). Giữ nguyên để tương thích.</summary>
    public record TourDto(
        string TourId,
        string Name,
        string Description,
        int PoiCount,
        string? ThumbnailUrl,
        DateTime CreatedAt,
        IReadOnlyList<TourPoiDto> Pois
    );

    /// <summary>Detail cho Mobile.</summary>
    public record TourDetailDto(
        string TourId,
        string Name,
        string Description,
        int PoiCount,
        string? ThumbnailUrl,
        DateTime CreatedAt,
        IReadOnlyList<TourStepDto> Steps
    );

    /// <summary>CMS/Tương thích cũ dùng.</summary>
    public record TourPoiDto(
        string PoiId,
        string Title,
        int StepOrder
    );

    /// <summary>Mobile dùng để chạy Tour chi tiết từng bước.</summary>
    public record TourStepDto(
        string PoiId,
        string Title,
        string Description,
        string LogoUrl,
        double Latitude,
        double Longitude,
        int ActivationRadius,
        int StepOrder,
        string AudioUrl,
        List<string> Categories
    );

    public record TourCreateRequest(string Name, string Description);

    public record TourUpdateRequest(string? Name, string? Description);
}
