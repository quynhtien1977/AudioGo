using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Services.Interfaces;

namespace Server.Queues
{
    public class ContentPipelineHostedService : BackgroundService
    {
        private readonly IContentPipelineQueue _queue;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ContentPipelineHostedService> _logger;

        public ContentPipelineHostedService(
            IContentPipelineQueue queue,
            IServiceProvider serviceProvider,
            ILogger<ContentPipelineHostedService> logger)
        {
            _queue = queue;
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ContentPipelineHostedService is running.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var poiId = await _queue.ReadAsync(stoppingToken);
                    _logger.LogInformation($"[ContentPipeline] Processing POI: {poiId}");

                    await ProcessPoiPipelineAsync(poiId, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred processing POI in ContentPipelineHostedService.");
                }
            }
        }

        private async Task ProcessPoiPipelineAsync(string poiId, CancellationToken stoppingToken)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var pipeline = scope.ServiceProvider.GetRequiredService<IContentPipelineService>();

                var poi = await dbContext.Pois
                    .Include(p => p.Contents)
                    .FirstOrDefaultAsync(p => p.PoiId == poiId, stoppingToken);
                
                if (poi == null) return;

                var master = poi.Contents.FirstOrDefault(c => c.IsMaster);
                if (master != null)
                {
                    try { await pipeline.GenerateAudioAsync(master); } catch { }
                }

                var targetLangs = new[] { "en", "fr", "ja", "ko", "vi", "zh-Hans", "th" };
                foreach (var lang in targetLangs)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    try
                    {
                        await pipeline.EnsureContentAsync(poi, lang);
                        await dbContext.Entry(poi).Collection(p => p.Contents).LoadAsync(stoppingToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Failed to process language {lang} for POI {poiId}");
                    }
                }
                
                _logger.LogInformation($"[ContentPipeline] Finished processing POI: {poiId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to process pipeline for POI: {poiId}");
            }
        }
    }
}
