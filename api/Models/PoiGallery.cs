namespace Server.Models
{
    public class PoiGallery
    {
        public string ImageId { get; set; } = string.Empty;
        public string PoiId { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public Poi? Poi { get; set; }
    }
}
