namespace Shared.DTOs
{
    public class DashboardStatsDto
    {
        public int TotalListens { get; set; }
        public List<DailyListenDto> DailyListens { get; set; }
    }

    public class DailyListenDto
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
    }
}