namespace Server.Models
{
    public class Poi
    {
        public string PoiId { get; set; } = string.Empty;
        public string AccountId { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int ActivationRadius { get; set; } = 20;
        public int Priority { get; set; } = 1;
        public string Status { get; set; } = string.Empty;
        public string LogoUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public Account? Account { get; set; }
        public ICollection<PoiContent> Contents { get; set; } = new List<PoiContent>();
        public ICollection<PoiGallery> Gallery { get; set; } = new List<PoiGallery>();
        public ICollection<CategoryPoi> CategoryPois { get; set; } = new List<CategoryPoi>();
    }
}
