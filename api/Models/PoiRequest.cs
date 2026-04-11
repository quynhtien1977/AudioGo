namespace Server.Models
{
    /// <summary>
    /// Bảng "vùng đệm" cho quy trình duyệt POI.
    /// Mọi thao tác CREATE / UPDATE / DELETE của chủ quán đều đi qua bảng này
    /// trước khi Admin phê duyệt để không làm gián đoạn dữ liệu live trên Mobile.
    /// </summary>
    public class PoiRequest
    {
        /// <summary>PK — GUID do server sinh.</summary>
        public string RequestId { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// FK → Poi.PoiId.
        /// NULL nếu là yêu cầu TẠO MỚI (chưa có POI thực trên DB).
        /// </summary>
        public string? PoiId { get; set; }

        /// <summary>FK → Account.AccountId — chủ quán gửi yêu cầu.</summary>
        public string AccountId { get; set; } = string.Empty;

        /// <summary>Loại yêu cầu: CREATE | UPDATE | DELETE</summary>
        public string ActionType { get; set; } = string.Empty;

        /// <summary>Trạng thái xét duyệt: PENDING | APPROVED | REJECTED</summary>
        public string ApprovalStatus { get; set; } = "PENDING";

        /// <summary>
        /// Chuỗi JSON chứa toàn bộ dữ liệu muốn thay đổi (PoiDraftDto).
        /// Được serialize từ: thông tin Poi + PoiContent(master) + CategoryIds + GalleryUrls.
        /// Với ACTION = DELETE, cột này có thể để NULL hoặc chuỗi rỗng.
        /// </summary>
        public string? ProposedData { get; set; }

        /// <summary>Lý do Admin từ chối (ghi vào khi ApprovalStatus = REJECTED).</summary>
        public string? RejectReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // ── Navigation Properties ────────────────────────────────────────────
        public Account? Account { get; set; }
        public Poi?     Poi     { get; set; }
    }
}
