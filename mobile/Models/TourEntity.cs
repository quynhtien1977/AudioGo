using SQLite;
using System;

namespace AudioGo.Models
{
    [Table("Tours")]
    public class TourEntity
    {
        [PrimaryKey]
        public string TourId { get; set; } = string.Empty;
        
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public string? LocalThumbnailPath { get; set; }
        public int PoiCount { get; set; }
        public string StepsJson { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        
        // Multi-language support
        [Indexed]
        public string LanguageCode { get; set; } = "vi";

        public DateTime LastSyncedAt { get; set; }
    }
}
