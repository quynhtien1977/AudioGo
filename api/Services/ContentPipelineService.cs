using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services;

public class ContentPipelineService : IContentPipelineService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ITranslationService _translator;
    private readonly ITtsService _tts;
    private readonly IBlobStorageService _blob;
    private readonly IConfiguration _config;
    private readonly ILogger<ContentPipelineService> _logger;

    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    public ContentPipelineService(
        IServiceScopeFactory scopeFactory,
        ITranslationService translator,
        ITtsService tts,
        IBlobStorageService blob,
        IConfiguration config,
        ILogger<ContentPipelineService> logger)
    {
        _scopeFactory = scopeFactory;
        _translator = translator;
        _tts = tts;
        _blob = blob;
        _config = config;
        _logger = logger;
    }

    public async Task<PoiContent> EnsureContentAsync(Poi poi, string targetLang)
    {
        // 1. Đã có content cho ngôn ngữ này → return ngay
        var existing = poi.Contents.FirstOrDefault(c => c.LanguageCode == targetLang);
        if (existing is not null)
            return existing;

        // 2. Tìm master content
        var master = poi.Contents.FirstOrDefault(c => c.IsMaster)
                  ?? poi.Contents.FirstOrDefault();
        if (master is null)
            throw new InvalidOperationException($"POI {poi.PoiId} has no content at all.");

        // Nếu master đã đúng ngôn ngữ đích → return master
        if (master.LanguageCode == targetLang)
            return master;

        // 3. Concurrency guard — tránh duplicate khi nhiều client cùng request
        var lockKey = $"{poi.PoiId}:{targetLang}";
        var semaphore = _locks.GetOrAdd(lockKey, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync();

        try
        {
            // Double-check sau khi lấy lock (ai đó có thể đã tạo xong)
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var dbExisting = await db.PoiContents
                .FirstOrDefaultAsync(c => c.PoiId == poi.PoiId && c.LanguageCode == targetLang);
            if (dbExisting is not null)
            {
                poi.Contents.Add(dbExisting);
                return dbExisting;
            }

            // 4. Translate
            var translatedTitle = await _translator.TranslateAsync(
                master.Title, master.LanguageCode, targetLang);
            var translatedDesc = await _translator.TranslateAsync(
                master.Description, master.LanguageCode, targetLang);

            // 5. TTS
            using var audioStream = await _tts.SynthesizeAsync(translatedDesc, targetLang);

            // 6. Upload to Blob
            var container = _config["Azure:BlobStorage:AudioContainer"] ?? "audio";
            var blobPath = $"{poi.PoiId}/{targetLang}.mp3";
            var audioUrl = await _blob.UploadAsync(container, blobPath, audioStream, "audio/mpeg");

            // 7. Save to DB
            var newContent = new PoiContent
            {
                ContentId = Guid.NewGuid().ToString(),
                PoiId = poi.PoiId,
                LanguageCode = targetLang,
                Title = translatedTitle,
                Description = translatedDesc,
                AudioUrl = audioUrl,
                IsMaster = false,
                CreatedAt = DateTime.UtcNow,
            };

            db.PoiContents.Add(newContent);
            await db.SaveChangesAsync();

            poi.Contents.Add(newContent);
            _logger.LogInformation("Pipeline created content for POI {PoiId} lang={Lang}", poi.PoiId, targetLang);

            return newContent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Pipeline failed for POI {PoiId} lang={Lang}, falling back to master",
                poi.PoiId, targetLang);
            // Fallback: trả master content (sai ngôn ngữ nhưng không crash)
            return master;
        }
        finally
        {
            semaphore.Release();
        }
    }
}
