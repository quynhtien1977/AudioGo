using System.Net.Http.Json;
using System.Text.Json;
using AudioGo.Helpers;
using AudioGo.Services.Interfaces;
using Microsoft.Maui.Devices.Sensors;

namespace AudioGo.Services;

/// <summary>
/// Lấy đường đi bộ thực tế thông qua backend proxy → Google Directions API.
/// Tránh Android key restriction khi gọi HTTP trực tiếp từ mobile.
/// Cache in-memory theo cacheKey. Fallback straight-line khi offline/lỗi.
/// </summary>
public class DirectionsService : IDirectionsService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILocationService _location;

    // In-memory cache: cacheKey → decoded route points
    private readonly Dictionary<string, List<Location>> _cache = new();

    public DirectionsService(IHttpClientFactory httpFactory, ILocationService location)
    {
        _httpFactory = httpFactory;
        _location = location;
    }

    public async Task<List<Location>> GetWalkingRouteAsync(
        string cacheKey,
        List<(double Lat, double Lng)> poiWaypoints,
        bool prependUserLocation = false)
    {
        var waypoints = new List<(double Lat, double Lng)>(poiWaypoints);

        if (prependUserLocation)
        {
            var userLoc = await _location.GetCurrentLocationAsync();
            if (userLoc.HasValue && waypoints.Count > 0)
            {
                var distToFirst = GeoHelper.HaversineMeters(
                    userLoc.Value.Lat, userLoc.Value.Lon,
                    waypoints[0].Lat, waypoints[0].Lng);

                if (distToFirst > 50)
                    waypoints.Insert(0, userLoc.Value);
            }
        }

        // 1. Cache hit → trả ngay
        if (_cache.TryGetValue(cacheKey, out var cached))
            return cached;

        // 2. Không đủ điểm → fallback
        if (waypoints.Count < 2)
            return waypoints.Select(w => new Location(w.Lat, w.Lng)).ToList();

        try
        {
            var route = await FetchViaBackendAsync(waypoints);
            _cache[cacheKey] = route;
            return route;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine(
                $"[DirectionsService] Lỗi: {ex.Message} — fallback straight-line");
            return StraightLineFallback(waypoints);
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private async Task<List<Location>> FetchViaBackendAsync(
        List<(double Lat, double Lng)> waypoints)
    {
        // Xây dựng waypoints param: "lat1,lng1|lat2,lng2|..."
        // Dùng InvariantCulture để tránh dấu phẩy thay dấu chấm trên locale EU
        var waypointsParam = string.Join("|",
            waypoints.Select(w =>
                $"{w.Lat.ToString(System.Globalization.CultureInfo.InvariantCulture)}," +
                $"{w.Lng.ToString(System.Globalization.CultureInfo.InvariantCulture)}"));

        var client = _httpFactory.CreateClient("directions");
        var encodedParam = Uri.EscapeDataString(waypointsParam);
        var url = $"api/mobile/tours/directions?waypoints={encodedParam}&mode=walking";

        using var response = await client.GetAsync(url);
        if (!response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            throw new Exception($"HTTP {response.StatusCode}: {content}");
        }

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        var encoded = json.GetProperty("encodedPolyline").GetString();
        if (string.IsNullOrEmpty(encoded))
            throw new Exception("Backend trả về encodedPolyline rỗng");

        return PolylineDecoder.Decode(encoded);
    }

    /// <summary>Nối thẳng các POI khi không lấy được route thực.</summary>
    private static List<Location> StraightLineFallback(List<(double Lat, double Lng)> waypoints)
        => waypoints.Select(w => new Location(w.Lat, w.Lng)).ToList();
}
