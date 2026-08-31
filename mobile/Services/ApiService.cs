using AudioGo.Services.Interfaces;
using Shared;
using Shared.DTOs;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Net;
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

        public async Task<List<Shared.DTOs.CategoryDto>> GetCategoriesAsync(string languageCode = "vi", CancellationToken ct = default)
        {
            try
            {
                var result = await _http.GetFromJsonAsync<List<Shared.DTOs.CategoryDto>>($"api/mobile/categories?lang={languageCode}", ct);
                return result ?? new List<Shared.DTOs.CategoryDto>();
            }
            catch
            {
                return new List<Shared.DTOs.CategoryDto>();
            }
        }

        public async Task<TourDetailDto?> GetTourByIdAsync(string tourId, string lang = "vi", CancellationToken ct = default)
        {
            try
            {
                var url    = $"api/mobile/tours/{tourId}?lang={lang}";
                var detail = await _http.GetFromJsonAsync<TourDetailDto>(url, ct);
                if (detail is null) return null;

                // Patch relative URLs trong Steps
                var baseUrl = _http.BaseAddress?.ToString().TrimEnd('/');
                if (!string.IsNullOrEmpty(baseUrl))
                {
                    foreach (var step in detail.Steps)
                    {
                        if (!string.IsNullOrEmpty(step.AudioUrl) && !step.AudioUrl.StartsWith("http"))
                        {
                            // TourStepDto là record — không patch trực tiếp;
                            // TourStepVm constructor sẽ dùng baseUrl khi khởi tạo
                        }
                    }

                    // Patch ThumbnailUrl của tour
                    if (!string.IsNullOrEmpty(detail.ThumbnailUrl) && !detail.ThumbnailUrl.StartsWith("http"))
                        detail = detail with { ThumbnailUrl = $"{baseUrl}/{detail.ThumbnailUrl.TrimStart('/')}" };
                }

                return detail;
            }
            catch (Exception ex)
            {
                #if DEBUG
                System.Diagnostics.Debug.WriteLine($"[ApiService] GetTourByIdAsync: {ex.Message}");
                #endif
                return null;
            }
        }

        public async Task<PoiDeltaDto?> GetDeltaAsync(
            DateTime since,
            string languageCode,
            CancellationToken ct = default)
        {
            try
            {
                // Format as ISO-8601 round-trip (Z suffix = UTC)
                var sinceStr = since.ToUniversalTime().ToString("O");
                var url = $"api/mobile/pois/delta?since={Uri.EscapeDataString(sinceStr)}&lang={languageCode}";

                var delta = await _http.GetFromJsonAsync<PoiDeltaDto>(url, ct);
                if (delta is null) return null;

                // Patch relative URLs cho Updated POIs (giống GetPoisAsync)
                var baseUrl = _http.BaseAddress?.ToString().TrimEnd('/');
                if (!string.IsNullOrEmpty(baseUrl))
                {
                    foreach (var r in delta.Updated)
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

                return delta;
            }
            catch (Exception ex)
            {
                #if DEBUG
                System.Diagnostics.Debug.WriteLine($"[ApiService] GetDeltaAsync failed: {ex.Message}");
                #endif
                return null;
            }
        }

        public async Task<(bool IsSuccess, string Message, string? Token)> ScanQrAsync(string code, string deviceId, CancellationToken ct = default)
        {
            try
            {
                var resp = await _http.PostAsJsonAsync("api/mobile/auth/scan-qr", new
                {
                    Code = code,
                    DeviceId = deviceId
                }, ct);

                if (resp.IsSuccessStatusCode)
                {
                    var result = await resp.Content.ReadFromJsonAsync<ScanQrResponse>(cancellationToken: ct);
                    return (true, result?.Message ?? "Thành công", result?.Token);
                }
                else
                {
                    var errStr = await resp.Content.ReadAsStringAsync(ct);
                    return (false, string.IsNullOrEmpty(errStr) ? "Có lỗi xảy ra khi quét mã." : errStr, null);
                }
            }
            catch (Exception ex)
            {
                return (false, ex.Message, null);
            }
        }

        private class ScanQrResponse
        {
            public string? Message { get; set; }
            public string? Token { get; set; }
            public DateTime? ExpireAt { get; set; }
        }

        // ── Tourist Access Payment ────────────────────────────────────────────

        public async Task<TouristPaymentInitResult?> InitTouristPaymentAsync(
            string deviceId, CancellationToken ct = default)
        {
            var sw = Stopwatch.StartNew();
            var endpoint = "api/mobile/payment/init";
            try
            {
                var req = BuildInitPaymentRequest(endpoint, deviceId);

                #if DEBUG
                System.Diagnostics.Debug.WriteLine(
                    $"[ApiService] InitTouristPaymentAsync START => {_http.BaseAddress}{endpoint} | Timeout={_http.Timeout.TotalSeconds}s");
                #endif

                HttpResponseMessage? resp = null;
                for (var attempt = 1; attempt <= 2; attempt++)
                {
                    using var sendReq = attempt == 1 ? req : BuildInitPaymentRequest(endpoint, deviceId);
                    try
                    {
                        resp = await _http.SendAsync(sendReq, ct);
                        break;
                    }
                    catch (HttpRequestException ex) when (IsTransientInitTransportError(ex) && !ct.IsCancellationRequested && attempt == 1)
                    {
                        // Tunnel có thể đóng sớm ở lần đầu (Broken pipe/ResponseEnded).
                        // Retry một lần với request mới để tạo kết nối mới.
                        #if DEBUG
                        System.Diagnostics.Debug.WriteLine(
                            $"[ApiService] InitTouristPaymentAsync RETRY => transient transport error ({ex.InnerException?.GetType().Name}), retrying once...");
                        #endif
                        await Task.Delay(300, ct);
                    }
                }

                if (resp is null) throw new HttpRequestException("Init payment request failed with no response.");

                sw.Stop();

                #if DEBUG
                System.Diagnostics.Debug.WriteLine(
                    $"[ApiService] InitTouristPaymentAsync RESPONSE => {(int)resp.StatusCode} {resp.StatusCode} | Elapsed={sw.ElapsedMilliseconds}ms");
                #endif

                if (!resp.IsSuccessStatusCode) return null;

                var raw = await resp.Content.ReadFromJsonAsync<InitRawResponse>(cancellationToken: ct);
                if (raw is null) return null;

                return new TouristPaymentInitResult(
                    TransactionId:   raw.TransactionId   ?? "",
                    Amount:          raw.Amount,
                    DurationDays:    raw.DurationDays,
                    BankAccount:     raw.BankAccount     ?? "",
                    BankName:        raw.BankName        ?? "TP Bank",
                    TransferContent: raw.TransferContent ?? "",
                    VietQrUrl:       raw.VietQrUrl       ?? "",
                    ExpireInMinutes: raw.ExpireInMinutes
                );
            }
            catch (Exception ex)
            {
                sw.Stop();
                #if DEBUG
                System.Diagnostics.Debug.WriteLine(
                    $"[ApiService] InitTouristPaymentAsync ERROR => {ex.GetType().Name}: {ex.Message} | Inner={ex.InnerException?.GetType().Name}: {ex.InnerException?.Message} | Elapsed={sw.ElapsedMilliseconds}ms");
                #endif
                return null;
            }
        }

        private static HttpRequestMessage BuildInitPaymentRequest(string endpoint, string deviceId)
        {
            var req = new HttpRequestMessage(HttpMethod.Post, endpoint)
            {
                Version = new Version(1, 1),
                VersionPolicy = HttpVersionPolicy.RequestVersionOrLower,
                Content = JsonContent.Create(new
                {
                    DeviceId = deviceId
                })
            };
            req.Headers.ConnectionClose = true;
            return req;
        }

        private static bool IsTransientInitTransportError(HttpRequestException ex)
        {
            // Case 1: socket bị đóng khi đang ghi body request
            if (ex.InnerException is IOException ioEx)
            {
                var socketEx = ioEx.InnerException as System.Net.Sockets.SocketException;
                if (socketEx != null &&
                    (socketEx.Message.Contains("Broken pipe", StringComparison.OrdinalIgnoreCase) || socketEx.ErrorCode == 32))
                    return true;
            }

            // Case 2: phía tunnel đóng response stream sớm
            if (ex.InnerException is HttpIOException httpIoEx &&
                httpIoEx.Message.Contains("Response ended prematurely", StringComparison.OrdinalIgnoreCase))
                return true;

            return false;
        }

        public async Task<TouristPaymentVerifyResult?> VerifyTouristPaymentAsync(
            string transactionId, string deviceId, CancellationToken ct = default)
        {
            try
            {
                var url  = $"api/mobile/payment/verify?transactionId={Uri.EscapeDataString(transactionId)}&deviceId={Uri.EscapeDataString(deviceId)}";
                var raw  = await _http.GetFromJsonAsync<VerifyRawResponse>(url, ct);
                if (raw is null) return null;
                return new TouristPaymentVerifyResult(raw.Status ?? "PENDING", raw.Message ?? "", raw.Token);
            }
            catch (Exception ex)
            {
                #if DEBUG
                System.Diagnostics.Debug.WriteLine($"[ApiService] VerifyTouristPaymentAsync: {ex.Message}");
                #endif
                return null;
            }
        }

        public async Task<List<ListenHistoryItemDto>?> GetListenHistoryAsync(
            string deviceId, string lang = "vi", int limit = 5, CancellationToken ct = default)
        {
            try
            {
                var url = $"api/mobile/listen-history/{Uri.EscapeDataString(deviceId)}" +
                          $"?lang={Uri.EscapeDataString(lang)}&limit={limit}";

                var items = await _http.GetFromJsonAsync<List<ListenHistoryItemDto>>(url, ct);
                return items;
            }
            catch (Exception ex)
            {
                #if DEBUG
                Debug.WriteLine($"[ApiService] GetListenHistoryAsync: {ex.Message}");
                #endif
                return null;
            }
        }

        public async Task<List<ArticleItemDto>> GetArticlesAsync(string type = "tip", string lang = "vi", int limit = 10, CancellationToken ct = default)
        {
            try
            {
                var url = $"api/mobile/articles?type={Uri.EscapeDataString(type)}&lang={Uri.EscapeDataString(lang)}&limit={limit}";
                var result = await _http.GetFromJsonAsync<List<ArticleItemDto>>(url, ct);
                if (result != null)
                {
                    var baseUrl = _http.BaseAddress?.ToString().TrimEnd('/');
                    if (!string.IsNullOrEmpty(baseUrl))
                    {
                        foreach (var a in result)
                        {
                            if (!string.IsNullOrEmpty(a.ImageUrl) && !a.ImageUrl.StartsWith("http"))
                            {
                                a.ImageUrl = $"{baseUrl}/{a.ImageUrl.TrimStart('/')}";
                            }
                        }
                    }
                }
                return result ?? new List<ArticleItemDto>();
            }
            catch (Exception ex)
            {
                #if DEBUG
                Debug.WriteLine($"[ApiService] GetArticlesAsync error: {ex.Message}");
                #endif
                return new List<ArticleItemDto>();
            }
        }

        public async Task<ArticleItemDto?> GetArticleDetailAsync(string articleId, string lang = "vi", CancellationToken ct = default)
        {
            try
            {
                var url = $"api/mobile/articles/{Uri.EscapeDataString(articleId)}?lang={Uri.EscapeDataString(lang)}";
                var result = await _http.GetFromJsonAsync<ArticleItemDto>(url, ct);
                if (result != null)
                {
                    var baseUrl = _http.BaseAddress?.ToString().TrimEnd('/');
                    if (!string.IsNullOrEmpty(baseUrl))
                    {
                        if (!string.IsNullOrEmpty(result.ImageUrl) && !result.ImageUrl.StartsWith("http"))
                        {
                            result.ImageUrl = $"{baseUrl}/{result.ImageUrl.TrimStart('/')}";
                        }
                    }
                }
                return result;
            }
            catch (Exception ex)
            {
                #if DEBUG
                Debug.WriteLine($"[ApiService] GetArticleDetailAsync error: {ex.Message}");
                #endif
                return null;
            }
        }

        private class InitRawResponse
        {
            public string?  TransactionId   { get; set; }
            public decimal  Amount          { get; set; }
            public int      DurationDays    { get; set; }
            public string?  BankAccount     { get; set; }
            public string?  BankName        { get; set; }
            public string?  TransferContent { get; set; }
            public string?  VietQrUrl       { get; set; }
            public int      ExpireInMinutes { get; set; }
        }

        private class VerifyRawResponse
        {
            public string? Status  { get; set; }
            public string? Message { get; set; }
            public string? Token   { get; set; }
        }

        // ── System Alert ─────────────────────────────────────────────────────────

        /// <inheritdoc/>
        public async Task<NotificationDto?> GetSystemAlertAsync(CancellationToken ct = default)
        {
            try
            {
                // Public endpoint — không cần Bearer token
                return await _http.GetFromJsonAsync<NotificationDto>("api/mobile/system-alert", ct);
            }
            catch (Exception ex)
            {
                #if DEBUG
                Debug.WriteLine($"[ApiService] GetSystemAlertAsync error: {ex.Message}");
                #endif
                return null; // fail silently — không block app startup
            }
        }
    }
}
