namespace Shared
{
    /// <summary>
    /// API DTO trả về cho mobile — kết hợp dữ liệu từ bảng Poi + PoiContent (một ngôn ngữ).
    /// </summary>
    public class POI
    {
        // ── Poi table ──────────────────────────────────────────────
        public string PoiId { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int ActivationRadius { get; set; } = 20;
        public int Priority { get; set; } = 1;
        public bool IsActive { get; set; } = true;
        public string? LogoUrl { get; set; }
        public string? LocalLogoPath { get; set; }

        // ── PoiContent table (ngôn ngữ yêu cầu / master) ──────────
        public string LanguageCode { get; set; } = "vi";
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? AudioUrl { get; set; }

        // ── Local cache paths (device-only, set by SyncService) ────
        /// <summary>Đường dẫn file audio đã tải về máy. Chỉ tồn tại trên SQLite device, không từ server.</summary>
        public string? LocalAudioPath { get; set; }

        // ── Relations ──────────────────────────────────────────────
        /// <summary>Danh sách tên category (ví dụ: ["Ẩm thực", "Hải sản"]).</summary>
        public List<string> Categories { get; set; } = [];

        /// <summary>Danh sách URL ảnh gallery của POI.</summary>
        public List<string> GalleryUrls { get; set; } = [];
    }
}
