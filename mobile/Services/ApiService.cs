using AudioGo.Services.Interfaces;
using Shared;
using Shared.DTOs;
using System.Collections.ObjectModel;
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

        public async Task<List<POI>> GetPoisAsync(string? languageCode = null, string? query = null, string? category = null, CancellationToken ct = default)
        {
            var url = "api/mobile/pois";
            var queryParams = new List<string>();

            if (!string.IsNullOrEmpty(languageCode)) queryParams.Add($"lang={languageCode}");
            if (!string.IsNullOrEmpty(query)) queryParams.Add($"q={Uri.EscapeDataString(query)}");
            if (!string.IsNullOrEmpty(category)) queryParams.Add($"category={Uri.EscapeDataString(category)}");

            if (queryParams.Count > 0)
                url += "?" + string.Join("&", queryParams);

            var result = await _http.GetFromJsonAsync<List<POI>>(url, ct);
            return result ?? new List<POI>();
        }

        public async Task<List<Shared.DTOs.TourSummaryDto>> GetToursAsync(string? languageCode = null, string? query = null, CancellationToken ct = default)
        {
            var url = "api/mobile/tours";
            var queryParams = new List<string>();

            if (!string.IsNullOrEmpty(languageCode)) queryParams.Add($"lang={languageCode}");
            if (!string.IsNullOrEmpty(query)) queryParams.Add($"q={Uri.EscapeDataString(query)}");

            if (queryParams.Count > 0)
                url += "?" + string.Join("&", queryParams);

            var result = await _http.GetFromJsonAsync<List<Shared.DTOs.TourSummaryDto>>(url, ct);
            return result ?? new List<Shared.DTOs.TourSummaryDto>();
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
                new LocationLogBatchRequest
                {
                    DeviceId = deviceId,
                    Points = new List<LocationPoint>
                    {
                        new LocationPoint { Latitude = latitude, Longitude = longitude, Timestamp = DateTime.UtcNow }
                    }
                }, ct);
        }

        public async Task<bool> CreateTourAsync(Shared.DTOs.TourCreateRequest request, CancellationToken ct = default)
        {
            var resp = await _http.PostAsJsonAsync("api/mobile/tours", request, ct);
            return resp.IsSuccessStatusCode;
        }
    }
}
