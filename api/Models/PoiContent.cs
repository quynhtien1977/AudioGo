namespace Server.Models
{
    public class PoiContent
    {
        public string ContentId { get; set; } = string.Empty;
        public string PoiId { get; set; } = string.Empty;
        public string LanguageCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string AudioUrl { get; set; } = string.Empty;
        public string LocalAudioPath { get; set; } = string.Empty;
        public bool IsMaster { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public Poi? Poi { get; set; }
    }
}
