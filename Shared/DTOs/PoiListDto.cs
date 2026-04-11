namespace Shared.DTOs
{
    public class PoiListDto
    {
        public string PoiId { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int ActivationRadius { get; set; }
        public int Priority { get; set; }

        public string LogoUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public List<PoiContentDto> Contents { get; set; }
    }

    
}