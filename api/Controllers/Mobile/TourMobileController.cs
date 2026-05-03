using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Net.Http.Json;
using System.Text.Json;

namespace Server.Controllers.Mobile
{
    [ApiController]
    [Route("api/mobile/tours")]
    [EnableCors("MobilePolicy")]
    public class TourMobileController : ControllerBase
    {
        private readonly ITourRepository _tourRepo;
        private readonly IContentPipelineService _pipeline;
        private readonly IHttpClientFactory _httpFactory;
        private readonly IConfiguration _config;

        public TourMobileController(
            ITourRepository tourRepo,
            IContentPipelineService pipeline,
            IHttpClientFactory httpFactory,
            IConfiguration config)
        {
            _tourRepo = tourRepo;
            _pipeline = pipeline;
            _httpFactory = httpFactory;
            _config = config;
        }

        // GET /api/mobile/tours?lang=vi
        // GET /api/mobile/tours?lang=vi&q=hải+sản
        [HttpGet]
        public async Task<ActionResult<List<TourSummaryDto>>> GetAll(
            [FromQuery] string lang = "vi",
            [FromQuery] string? q = null)
        {
            var tours = await _tourRepo.GetAllAsync();

            // Filter theo tên tour nếu có search query
            if (!string.IsNullOrWhiteSpace(q))
                tours = tours.Where(t =>
                    t.Name.Contains(q, StringComparison.OrdinalIgnoreCase)
                ).ToList();

            var result = tours.Select(t => new TourSummaryDto(
                TourId:       t.TourId,
                Name:         t.Name,
                Description:  t.Description ?? string.Empty,
                PoiCount:     t.TourPois.Count,
                // Ưu tiên ThumbnailUrl của tour, fallback sang LogoUrl của POI đầu tiên
                ThumbnailUrl: t.ThumbnailUrl
                              ?? t.TourPois
                                   .OrderBy(tp => tp.StepOrder)
                                   .FirstOrDefault()?.Poi?.LogoUrl,
                CreatedAt:    t.CreatedAt
            )).ToList();

            return Ok(result);
        }

        // GET /api/mobile/tours/{tourId}?lang=vi
        [HttpGet("{tourId}")]
        public async Task<ActionResult<TourDetailDto>> GetById(
            string tourId, [FromQuery] string lang = "vi")
        {
            var tour = await _tourRepo.GetByIdAsync(tourId);
            if (tour is null || !tour.IsActive) return NotFound();

            var steps = new List<TourStepDto>();
            foreach (var tp in tour.TourPois.OrderBy(t => t.StepOrder))
            {
                if (tp.Poi is null) continue;

                var content = await _pipeline.EnsureContentAsync(tp.Poi, lang);
                steps.Add(new TourStepDto(
                    PoiId:           tp.PoiId,
                    Title:           content.Title,
                    Description:     content.Description,
                    LogoUrl:         tp.Poi.LogoUrl ?? string.Empty,
                    Latitude:        tp.Poi.Latitude,
                    Longitude:       tp.Poi.Longitude,
                    ActivationRadius: tp.Poi.ActivationRadius,
                    StepOrder:       tp.StepOrder,
                    AudioUrl:        content.AudioUrl ?? string.Empty,
                    Categories:      tp.Poi.CategoryPois
                                        .Select(cp => cp.Category?.Name ?? string.Empty)
                                        .Where(n => !string.IsNullOrEmpty(n))
                                        .ToList()
                ));
            }

            var thumbnailUrl = tour.ThumbnailUrl ?? tour.TourPois
                .OrderBy(tp => tp.StepOrder)
                .FirstOrDefault()?.Poi?.LogoUrl;

            return Ok(new TourDetailDto(
                TourId:       tour.TourId,
                Name:         tour.Name,
                Description:  tour.Description ?? string.Empty,
                PoiCount:     steps.Count,
                ThumbnailUrl: thumbnailUrl,
                CreatedAt:    tour.CreatedAt,
                Steps:        steps
            ));
        }

        // GET /api/mobile/tours/directions?waypoints=lat1,lng1|lat2,lng2|...&mode=walking
        // Sử dụng OpenRouteService (ORS) với API Key từ môi trường
        [HttpGet("directions")]
        public async Task<IActionResult> GetDirections(
            [FromQuery] string waypoints,
            [FromQuery] string mode = "walking")
        {
            var points = waypoints.Split('|', StringSplitOptions.RemoveEmptyEntries);
            if (points.Length < 2)
                return BadRequest(new { error = "Cần ít nhất 2 waypoints" });

            // Google là Lat,Lng => ORS nhận mảng [Lng, Lat]
            var orsCoords = new List<double[]>();
            foreach (var p in points)
            {
                var parts = p.Split(',');
                if (parts.Length == 2 && 
                    double.TryParse(parts[0], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var lat) && 
                    double.TryParse(parts[1], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var lng))
                {
                    orsCoords.Add(new[] { lng, lat });
                }
            }

            var orsProfile = mode == "walking" ? "foot-walking" : "driving-car";
            var url = $"https://api.openrouteservice.org/v2/directions/{orsProfile}";
            
            var apiKey = _config["ORS_API_KEY"];
            if (string.IsNullOrEmpty(apiKey))
                return StatusCode(500, new { error = "Chưa cấu hình ORS_API_KEY trên server" });

            try
            {
                var client = _httpFactory.CreateClient();
                client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", apiKey);
                client.DefaultRequestHeaders.Add("Accept", "application/json");

                // Payload cho ORS POST endpoint
                var requestBody = new
                {
                    coordinates = orsCoords,
                    instructions = false, // Tiết kiệm dung lượng, mobile không dùng text directions
                    elevation = false
                };

                using var response = await client.PostAsJsonAsync(url, requestBody);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorJson = await response.Content.ReadAsStringAsync();
                    return StatusCode(502, new { error = $"ORS API Error: {response.StatusCode}", detail = errorJson });
                }

                var json = await response.Content.ReadFromJsonAsync<JsonElement>();

                // Lấy polyline từ routes[0].geometry
                var encoded = json
                    .GetProperty("routes")[0]
                    .GetProperty("geometry")
                    .GetString();

                return Ok(new { encodedPolyline = encoded });
            }
            catch (Exception ex)
            {
                return StatusCode(502, new { error = ex.Message });
            }
        }
    }
}

