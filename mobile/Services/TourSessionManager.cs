using System;
using System.Collections.Generic;
using AudioGo.Helpers;
using AudioGo.Services.Interfaces;
using Shared;

namespace AudioGo.Services
{
    public class TourSessionManager : ITourSessionManager
    {
        private readonly IGeofenceService _geofence;

        public TourSession? ActiveSession { get; private set; }
        public bool IsActive => ActiveSession != null;

        public event EventHandler<string>? PoiVisited;
        public event EventHandler? SessionCompleted;

        public TourSessionManager(IGeofenceService geofence)
        {
            _geofence = geofence;
        }

        public void StartSession(string tourId, List<string> orderedPoiIds)
        {
            EndSession();   // dọn session cũ nếu có
            ActiveSession = new TourSession { TourId = tourId, OrderedPoiIds = orderedPoiIds };
            _geofence.PoiTriggered += OnPoiTriggered;

            System.Diagnostics.Debug.WriteLine($"[TourSession] Bắt đầu: {tourId}, {orderedPoiIds.Count} điểm");
        }

        public void EndSession()
        {
            if (ActiveSession == null) return;
            _geofence.PoiTriggered -= OnPoiTriggered;
            ActiveSession = null;
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

            PoiVisited?.Invoke(this, poi.PoiId);
            System.Diagnostics.Debug.WriteLine($"[TourSession] Đã đến: {poi.PoiId} — {ActiveSession.VisitedCount}/{ActiveSession.TotalCount}");

            if (ActiveSession.IsCompleted)
                SessionCompleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
