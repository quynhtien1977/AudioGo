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
            // Evaluate POIs from highest priority first; only trigger one per update
            foreach (var poi in _pois.OrderByDescending(p => p.Priority))
            {
                var dist = GeoHelper.HaversineMeters(latitude, longitude, poi.Latitude, poi.Longitude);
                if (dist > poi.ActivationRadius) continue;
                if (_lastTriggered.TryGetValue(poi.PoiId, out var last) && DateTime.UtcNow - last < _cooldown) continue;

                _lastTriggered[poi.PoiId] = DateTime.UtcNow;
                PoiTriggered?.Invoke(this, poi);
                break;
            }
        }
    }
}
