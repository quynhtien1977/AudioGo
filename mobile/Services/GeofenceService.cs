using AudioGo.Helpers;
using AudioGo.Services.Interfaces;
using Shared;

namespace AudioGo.Services
{
    public class GeofenceService : IGeofenceService
    {
        private readonly TimeSpan _cooldown = TimeSpan.FromMinutes(5);
        private readonly Dictionary<string, DateTime> _lastTriggered = new();
        private List<POI> _pois = new();

        public event EventHandler<POI>? PoiTriggered;

        public Task StartMonitoringAsync(IEnumerable<POI> pois)
        {
            _pois = pois.ToList();
            return Task.CompletedTask;
        }

        public Task StopMonitoringAsync()
        {
            _pois.Clear();
            _lastTriggered.Clear();
            return Task.CompletedTask;
        }

        public void OnLocationUpdated(double latitude, double longitude)
        {
            // Lọc ra tất cả các POI mà user đang đứng bên trong (thoả mãn bán kính và thời gian cooldown)
            var eligiblePois = new List<(POI Poi, double Distance)>();

            foreach (var poi in _pois)
            {
                var dist = GeoHelper.HaversineMeters(latitude, longitude, poi.Latitude, poi.Longitude);
                if (dist > poi.ActivationRadius) continue;
                if (_lastTriggered.TryGetValue(poi.PoiId, out var last) && DateTime.UtcNow - last < _cooldown) continue;

                eligiblePois.Add((poi, dist));
            }

            if (eligiblePois.Any())
            {
                // Sắp xếp: Ưu tiên Priority cao nhất trước, nếu bằng nhau thì chọn điểm có khoảng cách gần hơn
                var bestPoiMatch = eligiblePois
                    .OrderByDescending(x => x.Poi.Priority)
                    .ThenBy(x => x.Distance)
                    .First();

                var bestPoi = bestPoiMatch.Poi;

                _lastTriggered[bestPoi.PoiId] = DateTime.UtcNow;
                PoiTriggered?.Invoke(this, bestPoi);
            }
        }
    }
}
