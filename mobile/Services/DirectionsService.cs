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

    // In-memory cache: cacheKey → decoded route points
    private readonly Dictionary<string, List<Location>> _cache = new();

    public DirectionsService(IHttpClientFactory httpFactory)
    {
        _httpFactory = httpFactory;
    }

    public async Task<List<Location>> GetWalkingRouteAsync(
        string cacheKey,
        List<(double Lat, double Lng)> waypoints)
    {
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
        response.EnsureSuccessStatusCode();

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
