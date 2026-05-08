using System;
using System.Collections.Generic;
using AudioGo.Helpers;
using AudioGo.Services.Interfaces;
using Shared;
using System.Text.Json;

namespace AudioGo.Services
{
    public class TourSessionManager : ITourSessionManager
    {
        private const string PrefKey = "ActiveTourSession";
        private readonly IGeofenceService _geofence;

        public TourSession? ActiveSession { get; private set; }
        public bool IsActive => ActiveSession != null;

        public event EventHandler<string>? PoiVisited;
        public event EventHandler? SessionCompleted;

        public TourSessionManager(IGeofenceService geofence)
        {
            _geofence = geofence;
            LoadSession();
            if (ActiveSession != null)
            {
                _geofence.PoiTriggered += OnPoiTriggered;
            }
        }

        private void LoadSession()
        {
            var json = Preferences.Default.Get(PrefKey, string.Empty);
            if (!string.IsNullOrEmpty(json))
            {
                try
                {
                    ActiveSession = JsonSerializer.Deserialize<TourSession>(json);
                }
                catch
                {
                    ActiveSession = null;
                }
            }
        }

        private void SaveSession()
        {
            if (ActiveSession == null)
            {
                Preferences.Default.Remove(PrefKey);
            }
            else
            {
                var json = JsonSerializer.Serialize(ActiveSession);
                Preferences.Default.Set(PrefKey, json);
            }
        }

        public void StartSession(string tourId, List<string> orderedPoiIds)
        {
            EndSession();   // dọn session cũ nếu có
            ActiveSession = new TourSession { TourId = tourId, OrderedPoiIds = orderedPoiIds };
            SaveSession();
            _geofence.PoiTriggered += OnPoiTriggered;

            System.Diagnostics.Debug.WriteLine($"[TourSession] Bắt đầu: {tourId}, {orderedPoiIds.Count} điểm");
        }

        public void EndSession()
        {
            if (ActiveSession == null) return;
            _geofence.PoiTriggered -= OnPoiTriggered;
            ActiveSession = null;
            SaveSession();
            System.Diagnostics.Debug.WriteLine("[TourSession] Kết thúc session");
        }

        public void ResetSession()
        {
            if (ActiveSession == null) return;
            var tourId = ActiveSession.TourId;
            var ids    = ActiveSession.OrderedPoiIds;
            EndSession();
            StartSession(tourId, ids);  // tạo TourSession mới, VisitedPoiIds rỗng
            System.Diagnostics.Debug.WriteLine("[TourSession] Reset session");
        }

        private void OnPoiTriggered(object? sender, POI poi)
        {
            if (ActiveSession == null) return;
            if (!ActiveSession.MarkVisited(poi.PoiId)) return;   // không thuộc tour → bỏ qua

            SaveSession();
            PoiVisited?.Invoke(this, poi.PoiId);
            System.Diagnostics.Debug.WriteLine($"[TourSession] Đã đến: {poi.PoiId} — {ActiveSession.VisitedCount}/{ActiveSession.TotalCount}");

            if (ActiveSession.IsCompleted)
                SessionCompleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
