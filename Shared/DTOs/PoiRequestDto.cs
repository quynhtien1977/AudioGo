namespace Shared.DTOs
{
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  PoiDraftDto — cấu trúc JSON lưu vào PoiRequest.ProposedData
    //  Chứa đủ thông tin để tái tạo hoặc cập nhật 1 POI đầy đủ.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    public record PoiDraftDto(
        // ── Thông tin bảng Poi ───────────────────────────────────────────
        double   Latitude,
        double   Longitude,
        int      ActivationRadius,
        int      Priority,
        string?  LogoUrl,

        // ── Nội dung bản Master (tiếng Việt) — bảng PoiContent ──────────
        string   Title,
        string   Description,

        // ── Danh mục — bảng CategoryPoi ─────────────────────────────────
        List<string> CategoryIds,

        // ── Ảnh gallery — bảng PoiGallery ────────────────────────────────
        // URL tạm đã upload lên Blob Storage, chờ Admin duyệt mới gắn chính thức
        List<string> GalleryImageUrls
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  Request/Response DTO cho API PoiRequest (CMS & Owner)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /// <summary>Chủ quán gửi khi muốn tạo, sửa, hoặc xoá POI.</summary>
    public record SubmitPoiRequestDto(
        string        ActionType,   // CREATE | UPDATE | DELETE
        string?       PoiId, 
        PoiDraftDto?  Draft         // NULL nếu ActionType = DELETE
    );

    /// <summary>Admin gửi khi duyệt hoặc từ chối.</summary>
    public record ReviewPoiRequestDto(
        bool    Approved,
        string? RejectReason       // Bắt buộc khi Approved = false
    );

    /// <summary>Response trả về danh sách yêu cầu cho trang Admin.</summary>
    public record PoiRequestListDto(
        string   RequestId,
        string?  PoiId,
        string   AccountId,
        string   ActionType,
        string   Status,
        DateTime CreatedAt,
        string?  RejectReason,
        string?  ProposedData
    );

    /// <summary>Chi tiết 1 yêu cầu (dùng trên màn hình Diff của Admin).</summary>
    public record PoiRequestDetailDto(
        string        RequestId,
        string?       PoiId,
        string        AccountId,
        string        ActionType,
        string        Status,
        PoiDraftDto?  ProposedDraft,
        PoiDetailDto? CurrentPoi,
        DateTime      CreatedAt,
        string?       RejectReason
    );
}
