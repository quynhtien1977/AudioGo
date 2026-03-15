using AudioGo.Services.Interfaces;
using Shared;
using Shared.DTOs;
using System.Net.Http.Json;

namespace AudioGo.Services
{
    public class ApiService : IApiService
    {
        private readonly HttpClient _http;

        public ApiService(HttpClient http)
        {
            _http = http;
        }

        public async Task<List<POI>> GetPoisAsync(string? languageCode = null, CancellationToken ct = default)
        {
            var url = "api/mobile/pois";
            if (!string.IsNullOrEmpty(languageCode))
                url += $"?lang={languageCode}";

            var result = await _http.GetFromJsonAsync<List<POI>>(url, ct);
            return result ?? new List<POI>();
        }

        public async Task PostListenHistoryAsync(string poiId, string deviceId, int durationSeconds, CancellationToken ct = default)
        {
            await _http.PostAsJsonAsync("api/mobile/listen-history", new
            {
                PoiId = poiId,
                DeviceId = deviceId,
                ListenDuration = durationSeconds
            }, ct);
        }

        public async Task PostLocationLogAsync(string deviceId, double latitude, double longitude, CancellationToken ct = default)
        {
            await _http.PostAsJsonAsync("api/mobile/location-log",
                new LocationLogBatchRequest(deviceId, new[]
                {
                    new LocationPoint(latitude, longitude, DateTime.UtcNow)
                }), ct);
        }
    }
}
