namespace Shared.DTOs
{
    public class PoiListDto
    {
        public string PoiId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string AccountId { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int ActivationRadius { get; set; }
        public int Priority { get; set; }

        public string LogoUrl { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public string Category { get; set; } = string.Empty;

        public List<PoiContentDto> Contents { get; set; } = new List<PoiContentDto>();
    }

    
}