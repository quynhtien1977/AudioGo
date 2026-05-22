using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Server.Models
{
    public class Article
    {
        public string ArticleId { get; set; } = Guid.NewGuid().ToString();
        public string Type { get; set; } = "tip"; // "tip" | "news"
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
        public DateTime PublishedAt { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        [JsonIgnore]
        public ICollection<ArticleContent> Contents { get; set; } = new List<ArticleContent>();
    }

    public class ArticleContent
    {
        public string ArticleId { get; set; } = string.Empty;
        public string Lang { get; set; } = "vi";
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string? Body { get; set; }

        // Navigation
        [JsonIgnore]
        public Article? Article { get; set; }
    }
}
