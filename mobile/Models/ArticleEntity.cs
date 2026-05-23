using SQLite;
using System;

namespace AudioGo.Models
{
    /// <summary>
    /// Local SQLite entity cache for articles (Travel Tips and News) mapping to ArticleItemDto.
    /// Saved on device to enable offline-first access in the Explore tab.
    /// </summary>
    [Table("Articles")]
    public class ArticleEntity
    {
        [PrimaryKey, NotNull]
        public string ArticleId { get; set; } = string.Empty;

        [NotNull]
        public string Type { get; set; } = "tip"; // "tip" | "news"

        public string? ImageUrl { get; set; }

        [NotNull]
        public string Title { get; set; } = string.Empty;

        [NotNull]
        public string Summary { get; set; } = string.Empty;

        public string? Body { get; set; }

        public DateTime PublishedAt { get; set; }

        [NotNull]
        public string Lang { get; set; } = "vi";

        public DateTime SyncedAt { get; set; } = DateTime.UtcNow;
    }
}
