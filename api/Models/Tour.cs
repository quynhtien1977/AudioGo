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
        /// <summary>Soft-delete flag. False = tour đã bị ẩn bởi admin.</summary>
        public bool IsActive { get; set; } = true;

        // Navigation
        public ICollection<TourPoi> TourPois { get; set; } = new List<TourPoi>();
    }
}
