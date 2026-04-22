using Shared;

namespace AudioGo.Services.Interfaces
{
    public interface IGeofenceService
    {
        /// <summary>Fired when the user enters a POI radius and cooldown has elapsed.</summary>
        event EventHandler<POI> PoiTriggered;

        Task StartMonitoringAsync(IEnumerable<POI> pois);
        Task StopMonitoringAsync();

        /// <summary>Call this from the GPS location callback.</summary>
        void OnLocationUpdated(double latitude, double longitude);

        /// <summary>
        /// Xóa một POI khỏi danh sách giám sát (gọi khi POI bị admin ẩn/xóa).
        /// Cũng xóa cooldown timer của POI đó.
        /// </summary>
        Task RemovePoiAsync(string poiId);
    }
}
