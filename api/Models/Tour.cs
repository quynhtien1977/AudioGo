namespace Server.Models
{
    public class Tour
    {
        public string TourId { get; set; } = string.Empty;

        /// <summary>
        /// Plain Vietnamese text (CMS searchable / display identifier).
        /// Không lưu JSON ở đây.
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// JSON đa ngôn ngữ cho tên: {"vi":"Hành Trình","en":"Journey","ja":"旅","ko":"여행","zh-Hans":"旅程","fr":"Voyage","th":"การเดินทาง"}
        /// Nullable — nếu null thì fallback về Name.
        /// </summary>
        public string? LocalizedName { get; set; }

        /// <summary>
        /// JSON đa ngôn ngữ cho mô tả.
        /// Nullable — nếu null thì trả empty string.
        /// </summary>
        public string? LocalizedDescription { get; set; }

        /// <summary>
        /// Giữ lại để backward-compat với EF migration cũ.
        /// Sẽ được drop sau khi data migration hoàn thành.
        /// </summary>
        [Obsolete("Use LocalizedDescription instead.")]
        public string Description { get; set; } = string.Empty;

        public string? ThumbnailUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        /// <summary>Soft-delete flag. False = tour đã bị ẩn bởi admin.</summary>
        public bool IsActive { get; set; } = true;
        public DateTime? DeletedAt { get; set; }

        // Navigation
        public ICollection<TourPoi> TourPois { get; set; } = new List<TourPoi>();

        // ── Localization helpers ─────────────────────────────────────────

        /// <summary>
        /// Trả về tên đã được dịch theo ngôn ngữ yêu cầu.
        /// Fallback chain: lang → vi → en → Name (plain text).
        /// </summary>
        public string GetLocalizedName(string lang = "vi")
            => TryParseJson(LocalizedName, lang) ?? Name;

        /// <summary>
        /// Trả về mô tả đã được dịch theo ngôn ngữ yêu cầu.
        /// Fallback chain: lang → vi → en → Description (cũ) → empty string.
        /// </summary>
#pragma warning disable CS0618
        public string GetLocalizedDescription(string lang = "vi")
            => TryParseJson(LocalizedDescription, lang) ?? Description ?? string.Empty;
#pragma warning restore CS0618

        /// <summary>
        /// Parse JSON localization string và trả về giá trị cho ngôn ngữ yêu cầu.
        /// Trả về null nếu không parse được hoặc không tìm thấy.
        /// </summary>
        internal static string? TryParseJson(string? json, string lang)
        {
            if (string.IsNullOrWhiteSpace(json) || !json.TrimStart().StartsWith("{"))
                return null;

            try
            {
                var dict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(json);
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
