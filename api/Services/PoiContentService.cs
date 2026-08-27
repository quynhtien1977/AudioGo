using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Services;

/// <summary>
/// Quản lý nội dung đa ngôn ngữ (PoiContent) của một POI.
/// Logic quan trọng: Nếu cập nhật bản Master và đổi Title/Description,
/// xóa toàn bộ bản dịch (Slave) đã sinh trước đó để buộc dịch lại.
/// </summary>
public class PoiContentService : IPoiContentService
{
    private readonly AppDbContext _db;

    public PoiContentService(AppDbContext db) => _db = db;

    private static string Normalize(string? s) => s?.Replace("\r\n", "\n").Trim() ?? "";

    public async Task<List<PoiContentDto>> GetAllAsync(string poiId)
    {
        var contents = await _db.PoiContents.AsNoTracking()
            .Where(c => c.PoiId == poiId)
            .ToListAsync();

        return contents.Select(c => new PoiContentDto(
            c.ContentId, c.PoiId, c.LanguageCode,
            c.Title, c.Description, c.AudioUrl, c.IsMaster)).ToList();
    }

    public async Task<PoiContentDto> CreateAsync(string poiId, PoiContentCreateRequest req)
    {
        var content = new PoiContent
        {
            ContentId    = Guid.NewGuid().ToString(),
            PoiId        = poiId,
            LanguageCode = req.LanguageCode,
            Title        = req.Title,
            Description  = req.Description,
            AudioUrl     = req.AudioUrl,
            IsMaster     = req.IsMaster
        };
        _db.PoiContents.Add(content);
        await _db.SaveChangesAsync();

        return new PoiContentDto(content.ContentId, content.PoiId,
            content.LanguageCode, content.Title,
            content.Description, content.AudioUrl, content.IsMaster);
    }

    public async Task<PoiContentDto> UpdateAsync(string poiId, string contentId, PoiContentUpdateRequest req)
    {
        var content = await _db.PoiContents
            .FirstOrDefaultAsync(c => c.ContentId == contentId && c.PoiId == poiId)
            ?? throw new KeyNotFoundException($"Không tìm thấy content: {contentId}");

        bool titleChanged       = req.Title       is not null && Normalize(req.Title)       != Normalize(content.Title);
        bool descriptionChanged = req.Description is not null && Normalize(req.Description) != Normalize(content.Description);
        string? oldAudioUrl     = content.AudioUrl;

        if (titleChanged)       content.Title       = req.Title!;
        if (descriptionChanged) content.Description = req.Description!;
        if (req.IsMaster.HasValue) content.IsMaster = req.IsMaster.Value;

        if (content.IsMaster)
        {
            if (descriptionChanged)
            {
                // Description đổi: xóa audio master (để pipeline TTS lại từ description mới)
                // nếu audio gửi lên là audio cũ hoặc rỗng/null
                if (string.IsNullOrWhiteSpace(req.AudioUrl) || req.AudioUrl == oldAudioUrl)
                    content.AudioUrl = null;
                else
                    content.AudioUrl = req.AudioUrl;

                // Xóa toàn bộ slave — pipeline sẽ tự dịch lại + re-TTS từng ngôn ngữ
                await InvalidateSlavesAsync(poiId);
            }
            else
            {
                if (req.AudioUrl is not null) content.AudioUrl = req.AudioUrl;

                if (titleChanged)
                {
                    // Chỉ title đổi: sync title sang slave, không đụng description/audio
                    await UpdateSlaveTitlesAsync(poiId, content.Title);
                }
            }
        }
        else
        {
            if (req.AudioUrl is not null) content.AudioUrl = req.AudioUrl;
        }

        content.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return new PoiContentDto(content.ContentId, content.PoiId,
            content.LanguageCode, content.Title,
            content.Description, content.AudioUrl, content.IsMaster);
    }

    public async Task DeleteAsync(string poiId, string contentId)
    {
        var content = await _db.PoiContents
            .FirstOrDefaultAsync(c => c.ContentId == contentId && c.PoiId == poiId)
            ?? throw new KeyNotFoundException($"Không tìm thấy content: {contentId}");

        _db.PoiContents.Remove(content);
        await _db.SaveChangesAsync();
    }

    /// <inheritdoc />
    public async Task InvalidateSlavesAsync(string poiId)
    {
        var slaves = await _db.PoiContents
            .Where(c => c.PoiId == poiId && !c.IsMaster)
            .ToListAsync();

        if (slaves.Count > 0)
            _db.PoiContents.RemoveRange(slaves);
        // Không gọi SaveChangesAsync ở đây — caller tự commit trong transaction của mình
    }

    /// <inheritdoc />
    public async Task UpdateSlaveTitlesAsync(string poiId, string newTitle)
    {
        var slaves = await _db.PoiContents
            .Where(c => c.PoiId == poiId && !c.IsMaster)
            .ToListAsync();

        foreach (var slave in slaves)
        {
            slave.Title     = newTitle; // Giữ nguyên Description và AudioUrl
            slave.UpdatedAt = DateTime.UtcNow;
        }
        // Không gọi SaveChangesAsync ở đây — caller tự commit
    }
}
