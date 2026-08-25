using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace api.Controllers.Cms;

[ApiController]
[Route("api/cms/geocoding")]
[Authorize]
public class GeocodingController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    public GeocodingController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Proxy geocoding request sang Photon (thay vì Nominatim do network bị hijack).
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] int limit = 5)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { message = "Query is required" });

        var safeLimit = Math.Min(Math.Max(limit, 1), 10);
        // Sử dụng Photon API (dữ liệu OSM, free)
        var url = $"https://photon.komoot.io/api?q={Uri.EscapeDataString(q)}&limit={safeLimit}";

        try
        {
            var client   = _httpClientFactory.CreateClient("nominatim");
            var response = await client.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, new { message = "Geocoding upstream error" });

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            
            if (!doc.RootElement.TryGetProperty("features", out var features))
            {
                return Ok(new object[] { });
            }

            var results = new List<object>();
            foreach (var feature in features.EnumerateArray())
            {
                if (!feature.TryGetProperty("properties", out var props)) continue;
                if (!feature.TryGetProperty("geometry", out var geom)) continue;
                if (!geom.TryGetProperty("coordinates", out var coords) || coords.GetArrayLength() < 2) continue;

                var parts = new List<string>();
                if (props.TryGetProperty("name", out var n) && !string.IsNullOrWhiteSpace(n.GetString())) 
                    parts.Add(n.GetString().Trim());
                if (props.TryGetProperty("street", out var s) && !string.IsNullOrWhiteSpace(s.GetString())) 
                    parts.Add(s.GetString().Trim());
                if (props.TryGetProperty("district", out var d) && !string.IsNullOrWhiteSpace(d.GetString())) 
                    parts.Add(d.GetString().Trim());
                if (props.TryGetProperty("city", out var c) && !string.IsNullOrWhiteSpace(c.GetString())) 
                    parts.Add(c.GetString().Trim());
                if (props.TryGetProperty("state", out var st) && !string.IsNullOrWhiteSpace(st.GetString())) 
                    parts.Add(st.GetString().Trim());
                
                var displayName = string.Join(", ", parts);
                if (string.IsNullOrWhiteSpace(displayName)) 
                    displayName = "Unknown location";

                results.Add(new
                {
                    display_name = displayName,
                    lat = coords[1].GetDouble().ToString(System.Globalization.CultureInfo.InvariantCulture),
                    lon = coords[0].GetDouble().ToString(System.Globalization.CultureInfo.InvariantCulture)
                });
            }

            return Ok(results);
        }
        catch (TaskCanceledException)
        {
            return StatusCode(504, new { message = "Geocoding request timed out" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Geocoding error", detail = ex.Message });
        }
    }
}
