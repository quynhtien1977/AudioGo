using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Services.Interfaces;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/pipeline")]
    [Authorize]
    [EnableCors("WebCmsPolicy")]
    public class CmsContentPipelineController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IContentPipelineService _pipeline;
        private readonly ILogger<CmsContentPipelineController> _logger;

        public CmsContentPipelineController(
            AppDbContext db,
            IContentPipelineService pipeline,
            ILogger<CmsContentPipelineController> logger)
        {
            _db = db;
            _pipeline = pipeline;
            _logger = logger;
        }

        /// <summary>
        /// Generate audio cho 1 POI cụ thể — tất cả ngôn ngữ đang có.
        /// POST /api/cms/pipeline/generate/{poiId}
        /// </summary>
        [HttpPost("generate/{poiId}")]
        public async Task<IActionResult> GenerateForPoi(string poiId)
        {
            var contents = await _db.PoiContents
                .Where(c => c.PoiId == poiId)
                .ToListAsync();

            if (!contents.Any())
                return NotFound(new { error = $"POI '{poiId}' không có content nào." });

            var results = new List<object>();
            foreach (var content in contents)
            {
                try
                {
                    var updated = await _pipeline.GenerateAudioAsync(content);
                    results.Add(new
                    {
                        contentId = updated.ContentId,
                        languageCode = updated.LanguageCode,
                        title = updated.Title,
                        audioUrl = updated.AudioUrl,
                        status = "success"
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi generate audio cho content {Id}", content.ContentId);
                    results.Add(new
                    {
                        contentId = content.ContentId,
                        languageCode = content.LanguageCode,
                        title = content.Title,
                        audioUrl = content.AudioUrl,
                        status = "error",
                        error = ex.Message
                    });
                }
            }

            return Ok(new { poiId, results });
        }

        /// <summary>
        /// Generate audio cho TẤT CẢ content đang thiếu AudioUrl.
        /// POST /api/cms/pipeline/generate-all
        /// </summary>
        [HttpPost("generate-all")]
        public async Task<IActionResult> GenerateAll()
        {
            var contents = await _db.PoiContents
                .Include(c => c.Poi)
                .Where(c => c.AudioUrl == null || c.AudioUrl == "")
                .Where(c => c.Poi != null && c.Poi.Status == "active")
                .ToListAsync();

            if (!contents.Any())
                return Ok(new { message = "Tất cả content đã có audio. Không cần generate." });

            _logger.LogInformation("Bắt đầu generate audio cho {Count} content...", contents.Count);

            var results = new List<object>();
            var successCount = 0;
            var failCount = 0;

            foreach (var content in contents)
            {
                try
                {
                    var updated = await _pipeline.GenerateAudioAsync(content);
                    successCount++;
                    results.Add(new
                    {
                        poiId = content.PoiId,
                        contentId = updated.ContentId,
                        languageCode = updated.LanguageCode,
                        title = updated.Title,
                        audioUrl = updated.AudioUrl,
                        status = "success"
                    });
                }
                catch (Exception ex)
                {
                    failCount++;
                    _logger.LogError(ex, "Lỗi generate cho {PoiId}/{Lang}",
                        content.PoiId, content.LanguageCode);
                    results.Add(new
                    {
                        poiId = content.PoiId,
                        contentId = content.ContentId,
                        languageCode = content.LanguageCode,
                        status = "error",
                        error = ex.Message
                    });
                }
            }

            return Ok(new
            {
                message = $"Pipeline hoàn tất: {successCount} thành công, {failCount} lỗi.",
                totalContents = contents.Count,
                successCount,
                failCount,
                results
            });
        }

        /// <summary>
        /// Kiểm tra trạng thái audio — content nào đã có/thiếu.
        /// GET /api/cms/pipeline/status
        /// </summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetPipelineStatus()
        {
            var contents = await _db.PoiContents.AsNoTracking()
                .Include(c => c.Poi)
                .OrderBy(c => c.PoiId)
                .ThenBy(c => c.LanguageCode)
                .ToListAsync();

            var summary = contents.Select(c => new
            {
                poiId = c.PoiId,
                poiStatus = c.Poi?.Status,
                contentId = c.ContentId,
                languageCode = c.LanguageCode,
                title = c.Title,
                hasAudio = !string.IsNullOrEmpty(c.AudioUrl),
                audioUrl = c.AudioUrl
            });

            var total = contents.Count;
            var withAudio = contents.Count(c => !string.IsNullOrEmpty(c.AudioUrl));

            return Ok(new
            {
                totalContents = total,
                withAudio,
                withoutAudio = total - withAudio,
                contents = summary
            });
        }
    }
}
