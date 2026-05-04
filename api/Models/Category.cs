namespace Server.Models
{
    public class Category
    {
        public string CategoryId { get; set; } = string.Empty;

        /// <summary>
        /// Plain Vietnamese text (CMS searchable / display identifier).
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// JSON đa ngôn ngữ cho tên danh mục.
        /// Nullable — nếu null thì fallback về Name.
        /// </summary>
        public string? LocalizedName { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public ICollection<CategoryPoi> CategoryPois { get; set; } = new List<CategoryPoi>();

        // ── Localization helpers ─────────────────────────────────────────

        /// <summary>
        /// Trả về tên danh mục đã được dịch theo ngôn ngữ yêu cầu.
        /// Fallback chain: lang → vi → en → Name (plain text).
        /// </summary>
        public string GetLocalizedName(string lang = "vi")
            => TryParseJson(LocalizedName, lang) ?? Name;

        internal static string? TryParseJson(string? json, string lang)
        {
            if (string.IsNullOrWhiteSpace(json) || !json.TrimStart().StartsWith("{"))
                return null;

            try
            {
                var dict = System.Text.Json.JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, string>>(json);
                if (dict != null)
                {
                    if (dict.TryGetValue(lang, out var val) && !string.IsNullOrWhiteSpace(val)) return val;
                    if (dict.TryGetValue("vi", out var viVal) && !string.IsNullOrWhiteSpace(viVal)) return viVal;
                    if (dict.TryGetValue("en", out var enVal) && !string.IsNullOrWhiteSpace(enVal)) return enVal;
                }
            }
            catch { }
            return null;
        }
    }
}
