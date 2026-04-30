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
        IReadOnlyList<TourPoiDto> Pois,
        bool IsActive = true
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

    // ── Delta Sync ──────────────────────────────────────────────────────
    /// <summary>
    /// Response từ GET /api/mobile/pois/delta?since=&amp;lang=
    /// Mobile áp dụng upsert cho Updated và delete cho DeletedIds.
    /// </summary>
    public record PoiDeltaDto(
        /// <summary>POI mới hoặc đã thay đổi kể từ `since`.</summary>
        IReadOnlyList<Shared.POI> Updated,
        /// <summary>Danh sách PoiId bị ẩn / xóa kể từ `since`.</summary>
        IReadOnlyList<string> DeletedIds,
        /// <summary>Thời điểm server snapshot này (UTC). Mobile lưu lại làm lastSyncAt kế tiếp.</summary>
        DateTime ServerNow
    );
}
