using Microsoft.Maui.Devices.Sensors;

namespace AudioGo.Services.Interfaces;

public interface IDirectionsService
{
    /// <summary>
    /// Lấy đường đi bộ thực tế giữa các waypoints từ Google Directions API.
    /// Kết quả được cache theo cacheKey để tránh gọi lại khi quay lại cùng tour.
    /// Trả về straight-line fallback nếu offline hoặc API lỗi.
    /// </summary>
    Task<List<Location>> GetWalkingRouteAsync(
        string cacheKey,
        List<(double Lat, double Lng)> waypoints,
        bool prependUserLocation = false);
}
