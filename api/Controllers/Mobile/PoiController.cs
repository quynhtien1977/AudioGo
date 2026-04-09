using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;
using Shared;

namespace Server.Controllers.Mobile
{
    [ApiController]
    [Route("api/mobile/pois")]
    [EnableCors("MobilePolicy")]
    public class PoiController : ControllerBase
    {
        private readonly IPoiRepository _repo;
        private readonly IContentPipelineService _pipeline;

        public PoiController(IPoiRepository repo, IContentPipelineService pipeline)
        {
            _repo = repo;
            _pipeline = pipeline;
        }

        // GET /api/mobile/pois?lang=vi
        // GET /api/mobile/pois?lang=vi&q=hải+sản&category=Hải Sản
        [HttpGet]
        public async Task<ActionResult<IEnumerable<POI>>> GetAll(
            [FromQuery] string lang = "vi",
            [FromQuery] string? q = null,
            [FromQuery] string? category = null)
        {
            List<Poi> pois;

            // Nếu có search term → dùng SearchAsync, ngược lại GetAllAsync
            if (!string.IsNullOrWhiteSpace(q) || !string.IsNullOrWhiteSpace(category))
                pois = await _repo.SearchAsync(q, category);
            else
                pois = await _repo.GetAllAsync();

            var dtos = new List<POI>();
            foreach (var p in pois)
                dtos.Add(await ToDtoAsync(p, lang));
            return Ok(dtos);
        }

        // GET /api/mobile/pois/nearby?lat=10.72&lon=106.70&radius=500&lang=vi
        [HttpGet("nearby")]
        public async Task<ActionResult<IEnumerable<POI>>> GetNearby(
            [FromQuery] double lat, [FromQuery] double lon,
            [FromQuery] double radius = 500, [FromQuery] string lang = "vi")
        {
            var pois = await _repo.GetNearbyAsync(lat, lon, radius);
            var dtos = new List<POI>();
            foreach (var p in pois)
                dtos.Add(await ToDtoAsync(p, lang));
            return Ok(dtos);
        }

        // GET /api/mobile/pois/{poiId}?lang=vi
        [HttpGet("{poiId}")]
        public async Task<ActionResult<POI>> GetById(
            string poiId, [FromQuery] string lang = "vi")
        {
            var poi = await _repo.GetByIdAsync(poiId);
            return poi is null ? NotFound() : Ok(await ToDtoAsync(poi, lang));
        }

        // ── Private ────────────────────────────────────────────────────────

        private async Task<POI> ToDtoAsync(Poi p, string lang)
        {
            var content = await _pipeline.EnsureContentAsync(p, lang);

            // Categories từ CategoryPois navigation (include trong repository)
            var categories = p.CategoryPois
                .Select(cp => cp.Category?.Name ?? string.Empty)
                .Where(n => !string.IsNullOrEmpty(n))
                .ToList();

            // Gallery URLs từ PoiGallery navigation
            var galleryUrls = p.Gallery
                .OrderBy(g => g.SortOrder)
                .Select(g => g.ImageUrl)
                .ToList();

            return new POI
            {
                PoiId            = p.PoiId,
                Latitude         = p.Latitude,
                Longitude        = p.Longitude,
                ActivationRadius = p.ActivationRadius,
                Priority         = p.Priority,
                Status           = p.Status   ?? string.Empty,
                IsActive         = p.IsActive,
                LogoUrl          = p.LogoUrl  ?? string.Empty,
                LanguageCode     = content.LanguageCode,
                Title            = content.Title,
                Description      = content.Description,
                AudioUrl         = content.AudioUrl,
                Categories       = categories,
                GalleryUrls      = galleryUrls,
            };
        }
    }
}
