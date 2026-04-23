namespace Server.Models
{
    public class Tour
    {
        public string TourId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public ICollection<TourPoi> TourPois { get; set; } = new List<TourPoi>();
    }
}
