using AudioGo.Helpers;
using AudioGo.Services.Interfaces;
using Shared;

namespace AudioGo.Services
{
    public class GeofenceService : IGeofenceService
    {
        private readonly TimeSpan _cooldown = TimeSpan.FromMinutes(5);
        private readonly System.Collections.Concurrent.ConcurrentDictionary<string, DateTime> _lastTriggered = new();
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

        public Task RemovePoiAsync(string poiId)
        {
            _pois.RemoveAll(p => p.PoiId == poiId);
            _lastTriggered.TryRemove(poiId, out _);
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
                // ── 3-Tier POI Conflict Resolution ───────────────────────────────
                // Tier 1 : Priority          (subscription plan) — số cao hơn thắng
                // Tier 2 : HasLocalAudio     (preload offline)   — đã tải audio local thắng
                // Tier 3 : Distance          (gần tâm hơn)       — khoảng cách nhỏ hơn thắng
                //
                // Lý do giữ LINQ thay vì PriorityQueue:
                //   K (số POI eligible đồng thời) thường ≤ 5 → O(K log K) ≈ hằng số.
                //   Multi-level sort với LINQ tự mô tả, dễ đọc, không cần IComparer riêng.
                var sorted = eligiblePois
                    .OrderByDescending(x => x.Poi.Priority)         // Tier 1
                    .ThenByDescending(x => x.Poi.HasLocalAudio)     // Tier 2
                    .ThenBy(x => x.Distance)                        // Tier 3
                    .ToList();

                var bestPoiMatch = sorted[0];
                var bestPoi      = bestPoiMatch.Poi;

                // ── Structured conflict log (chỉ ghi khi có từ 2 ứng viên trở lên) ──
                if (eligiblePois.Count > 1)
                {
                    // Xác định tier nào đã phân giải conflict
                    var decisionTier = "Tier3_Distance";
                    var topPriority  = sorted[0].Poi.Priority;
                    var allSamePriority = sorted.All(x => x.Poi.Priority == topPriority);
                    if (!allSamePriority)
                    {
                        decisionTier = "Tier1_Priority";
                    }
                    else if (sorted[0].Poi.HasLocalAudio != sorted[1].Poi.HasLocalAudio)
                    {
                        decisionTier = "Tier2_HasLocalAudio";
                    }

                    System.Diagnostics.Debug.WriteLine(
                        $"[Geofence|Conflict] 🏆 WINNER: {bestPoi.Title} " +
                        $"(P={bestPoi.Priority}, D={bestPoiMatch.Distance:F1}m, " +
                        $"Audio={bestPoi.HasLocalAudio}, DecisionTier={decisionTier})");

                    for (int i = 1; i < sorted.Count; i++)
                    {
                        var loser = sorted[i];
                        System.Diagnostics.Debug.WriteLine(
                            $"[Geofence|Conflict] ❌ LOSER #{i}: {loser.Poi.Title} " +
                            $"(P={loser.Poi.Priority}, D={loser.Distance:F1}m, Audio={loser.Poi.HasLocalAudio})");
                    }

                    System.Diagnostics.Debug.WriteLine(
                        $"[Geofence|Conflict] ⬆️ Resolved by {decisionTier} | " +
                        $"Candidates: [{string.Join(", ", sorted.Select(x => $"{x.Poi.Title}(P={x.Poi.Priority},A={x.Poi.HasLocalAudio},D={x.Distance:F0}m)"))}]");
                }

                _lastTriggered[bestPoi.PoiId] = DateTime.UtcNow;
                PoiTriggered?.Invoke(this, bestPoi);
            }

        }
    }
}
