namespace Server.Models
{
    public class TourPoi
    {
        public string TourId { get; set; } = string.Empty;
        public string PoiId { get; set; } = string.Empty;
        public int StepOrder { get; set; }

        // Navigation
        public Tour? Tour { get; set; }
        public Poi? Poi { get; set; }
    }
}
