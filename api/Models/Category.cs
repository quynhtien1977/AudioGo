namespace Server.Models
{
    public class Category
    {
        public string CategoryId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public ICollection<CategoryPoi> CategoryPois { get; set; } = new List<CategoryPoi>();
    }
}
