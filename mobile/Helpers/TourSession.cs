using System.Collections.Generic;
using System.Linq;

namespace AudioGo.Helpers
{
    public class TourSession
    {
        public string TourId { get; init; } = string.Empty;
        public List<string> OrderedPoiIds { get; init; } = new();
        public HashSet<string> VisitedPoiIds { get; } = new();

        public int TotalCount => OrderedPoiIds.Count;
        public int VisitedCount => VisitedPoiIds.Count;
        public bool IsCompleted => VisitedCount > 0 && VisitedCount >= TotalCount;

        // Poi tiếp theo chưa visit (để highlight trên map)
        public string? NextPoiId => OrderedPoiIds
            .FirstOrDefault(id => !VisitedPoiIds.Contains(id));

        public bool MarkVisited(string poiId)
        {
            if (!OrderedPoiIds.Contains(poiId)) return false;
            return VisitedPoiIds.Add(poiId);
        }
    }
}
