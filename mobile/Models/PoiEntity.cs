using SQLite;

namespace AudioGo.Models
{
    /// <summary>
    /// Local SQLite entity cache — ánh xạ từ <see cref="Shared.POI"/> API DTO.
    /// Lưu trên thiết bị để hoạt động offline.
    /// </summary>
    [Table("Pois")]
    public class PoiEntity
    {
        // ── Poi table ──────────────────────────────────────────────
        [PrimaryKey]
        public string PoiId { get; set; } = string.Empty;

        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int ActivationRadius { get; set; } = 20;
        public int Priority { get; set; } = 1;

        [MaxLength(50)]
        public string Status { get; set; } = string.Empty;

        public string? LogoUrl { get; set; }

        // ── PoiContent table (cached per language) ─────────────────
        [MaxLength(10), NotNull]
        public string LanguageCode { get; set; } = "vi";

        [MaxLength(255), NotNull]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
        public string? AudioUrl { get; set; }
        public string? LocalAudioPath { get; set; }

        // ── Sync metadata ──────────────────────────────────────────
        /// <summary>JSON-serialised list of category names, e.g. "[\"Ẩm thực\",\"Hải sản\"]".</summary>
        public string CategoriesJson { get; set; } = string.Empty;

        /// <summary>JSON-serialised list of gallery image URLs.</summary>
        public string GalleryUrlsJson { get; set; } = string.Empty;

        public DateTime? LastSyncedAt { get; set; }
    }
}
