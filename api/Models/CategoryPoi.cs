namespace Server.Models
{
    public class CategoryPoi
    {
        public string CategoryId { get; set; } = string.Empty;
        public string PoiId { get; set; } = string.Empty;

        // Navigation
        public Category? Category { get; set; }
        public Poi? Poi { get; set; }
    }
}
