using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Controllers.Mobile
{
    [ApiController]
    [Route("api/mobile/tours")]
    [EnableCors("MobilePolicy")]
    public class TourMobileController : ControllerBase
    {
        private readonly ITourRepository _tourRepo;
        private readonly IContentPipelineService _pipeline;

        public TourMobileController(ITourRepository tourRepo, IContentPipelineService pipeline)
        {
            _tourRepo = tourRepo;
            _pipeline = pipeline;
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
            if (tour is null) return NotFound();

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

            var thumbnailUrl = tour.TourPois
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
    }
}
