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
            if (result != null)
            {
                var baseUrl = _http.BaseAddress?.ToString().TrimEnd('/');
                if (!string.IsNullOrEmpty(baseUrl))
                {
                    foreach (var r in result)
                    {
                        if (!string.IsNullOrEmpty(r.LogoUrl) && !r.LogoUrl.StartsWith("http"))
                            r.LogoUrl = $"{baseUrl}/{r.LogoUrl.TrimStart('/')}";
                        if (!string.IsNullOrEmpty(r.AudioUrl) && !r.AudioUrl.StartsWith("http"))
                            r.AudioUrl = $"{baseUrl}/{r.AudioUrl.TrimStart('/')}";
                        if (r.GalleryUrls != null)
                        {
                            for (int i = 0; i < r.GalleryUrls.Count; i++)
                                if (!r.GalleryUrls[i].StartsWith("http"))
                                    r.GalleryUrls[i] = $"{baseUrl}/{r.GalleryUrls[i].TrimStart('/')}";
                        }
                    }
                }
            }
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
            if (result != null)
            {
                var baseUrl = _http.BaseAddress?.ToString().TrimEnd('/');
                if (!string.IsNullOrEmpty(baseUrl))
                {
                    for (int i = 0; i < result.Count; i++)
                    {
                        var r = result[i];
                        if (!string.IsNullOrEmpty(r.ThumbnailUrl) && !r.ThumbnailUrl.StartsWith("http"))
                        {
                            result[i] = r with { ThumbnailUrl = $"{baseUrl}/{r.ThumbnailUrl.TrimStart('/')}" };
                        }
                    }
                }
            }
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

        public async Task<List<Shared.DTOs.CategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
        {
            try
            {
                var result = await _http.GetFromJsonAsync<List<Shared.DTOs.CategoryDto>>("api/mobile/categories", ct);
                return result ?? new List<Shared.DTOs.CategoryDto>();
            }
            catch
            {
                return new List<Shared.DTOs.CategoryDto>();
            }
        }

        public async Task<bool> CreateTourAsync(Shared.DTOs.TourCreateRequest request, CancellationToken ct = default)
        {
            var resp = await _http.PostAsJsonAsync("api/mobile/tours", request, ct);
            return resp.IsSuccessStatusCode;
        }
    }
}
