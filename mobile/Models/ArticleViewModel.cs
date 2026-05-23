using System;

namespace AudioGo.Mobile.Models
{
    /// <summary>
    /// View Model for representing Articles (Travel Tips &amp; News) in the UI.
    /// Exposes computed helper properties for XAML bindings.
    /// </summary>
    public class ArticleViewModel
    {
        public string ArticleId { get; set; } = string.Empty;
        public string Type { get; set; } = "tip"; // "tip" | "news"
        public string? ImageUrl { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string? Body { get; set; }
        public DateTime PublishedAt { get; set; }
        public string Lang { get; set; } = "vi";

        // ── Computed Properties ───────────────────────────────────

        /// <summary>Emoji symbol representating the type of article.</summary>
        public string TypeEmoji => Type.ToLower() switch
        {
            "tip" => "💡",
            "news" => "📰",
            _ => "📝"
        };

        /// <summary>Vibrant badge name for UI.</summary>
        public string TypeDisplayName => Type.ToLower() switch
        {
            "tip" => "Mẹo du lịch",
            "news" => "Tin tức",
            _ => "Bài viết"
        };

        /// <summary>Vibrant badge color hex code.</summary>
        public string TypeColorHex => Type.ToLower() switch
        {
            "tip" => "#FF9800", // Bright orange
            "news" => "#2196F3", // Sky blue
            _ => "#9E9E9E"
        };

        /// <summary>Format published date nicely (e.g., 20/05/2026).</summary>
        public string DateDisplay => PublishedAt.ToLocalTime().ToString("dd/MM/yyyy");

        /// <summary>Provide remote Image URL or fallback to null so XAML can display default placeholder icon.</summary>
        public string? DisplayImageSource => !string.IsNullOrWhiteSpace(ImageUrl) ? ImageUrl : null;

        /// <summary>Returns true if a custom image is available.</summary>
        public bool HasImage => !string.IsNullOrWhiteSpace(ImageUrl);
    }
}
