using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Text.Json;

namespace Server.Services;

public class BannerService : IBannerService
{
    private readonly AppDbContext         _db;
    private readonly IBlobStorageService  _blob;
    private readonly IConfiguration      _config;
    private readonly ITranslationService  _translation;

    public BannerService(AppDbContext db, IBlobStorageService blob, IConfiguration config, ITranslationService translation)
    {
        _db          = db;
        _blob        = blob;
        _config      = config;
        _translation = translation;
    }

    // ── CMS ───────────────────────────────────────────────────────────────────

    public async Task<List<BannerDto>> GetAllAsync(string? displayTarget = null, bool? isActive = null)
    {
        var q = _db.Banners.AsNoTracking().AsQueryable();

        if (displayTarget is not null)
            q = q.Where(b => b.DisplayTarget == displayTarget || b.DisplayTarget == "Both");

        if (isActive.HasValue)
            q = q.Where(b => b.IsActive == isActive.Value);

        return await q
            .OrderBy(b => b.SortOrder)
            .ThenByDescending(b => b.CreatedAt)
            .Select(b => ToDto(b))
            .ToListAsync();
    }

    public async Task<BannerDto?> GetByIdAsync(string bannerId)
    {
        var b = await _db.Banners.AsNoTracking().FirstOrDefaultAsync(x => x.BannerId == bannerId);
        return b is null ? null : ToDto(b);
    }

    public async Task<BannerDto> CreateAsync(UpsertBannerRequest req, string? createdByAccountId)
    {
        var banner = new Banner
        {
            Title                = req.Title,
            Subtitle             = req.Subtitle,
            ImageUrl             = req.ImageUrl,
            LinkUrl              = req.LinkUrl,
            DisplayTarget        = req.DisplayTarget,
            StartDate            = req.StartDate,
            EndDate              = req.EndDate,
            IsActive             = req.IsActive,
            SortOrder            = req.SortOrder,
            TitleTranslations    = req.TitleTranslations,
            SubtitleTranslations = req.SubtitleTranslations,
            CreatedByAccountId   = createdByAccountId,
            CreatedAt            = DateTime.UtcNow,
        };

        _db.Banners.Add(banner);
        await _db.SaveChangesAsync();
        return ToDto(banner);
    }

    public async Task<(bool Success, string? Error)> UpdateAsync(string bannerId, UpsertBannerRequest req)
    {
        var banner = await _db.Banners.FindAsync(bannerId);
        if (banner is null) return (false, "Không tìm thấy banner.");

        banner.Title                = req.Title;
        banner.Subtitle             = req.Subtitle;
        banner.ImageUrl             = req.ImageUrl;
        banner.LinkUrl              = req.LinkUrl;
        banner.DisplayTarget        = req.DisplayTarget;
        banner.StartDate            = req.StartDate;
        banner.EndDate              = req.EndDate;
        banner.IsActive             = req.IsActive;
        banner.SortOrder            = req.SortOrder;
        banner.TitleTranslations    = req.TitleTranslations;
        banner.SubtitleTranslations = req.SubtitleTranslations;
        banner.UpdatedAt            = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<bool> DeleteAsync(string bannerId)
    {
        var banner = await _db.Banners.FindAsync(bannerId);
        if (banner is null) return false;

        _db.Banners.Remove(banner);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleActiveAsync(string bannerId)
    {
        var banner = await _db.Banners.FindAsync(bannerId);
        if (banner is null) return false;

        banner.IsActive  = !banner.IsActive;
        banner.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<string> UploadImageAsync(Stream stream, string fileName, string contentType)
    {
        var container = _config["Azure:BlobStorage:ImageContainer"] ?? "images";
        var ext       = Path.GetExtension(fileName).ToLowerInvariant();
        var blobPath  = $"banners/{Guid.NewGuid():N}{ext}";
        return await _blob.UploadAsync(container, blobPath, stream, contentType);
    }

    // ── Public ────────────────────────────────────────────────────────────────

    public async Task<List<BannerDto>> GetActiveByTargetAsync(string displayTarget)
    {
        var now = DateTime.UtcNow;
        return await _db.Banners
            .AsNoTracking()
            .Where(b => b.IsActive
                     && (b.DisplayTarget == displayTarget || b.DisplayTarget == "Both")
                     && (b.StartDate == null || b.StartDate <= now)
                     && (b.EndDate   == null || b.EndDate   >= now))
            .OrderBy(b => b.SortOrder)
            .Select(b => ToDto(b))
            .ToListAsync();
    }

    // ── AutoTranslate ───────────────────────────────────────────────────────

    public async Task<(bool Success, string? Error)> AutoTranslateAsync(string bannerId)
    {
        var banner = await _db.Banners.FindAsync(bannerId);
        if (banner is null) return (false, "Không tìm thấy banner.");

        try
        {
            var titleTrans    = await _translation.TranslateToAllLanguagesAsync(banner.Title, "vi");
            var subtitleTrans = banner.Subtitle is not null
                ? await _translation.TranslateToAllLanguagesAsync(banner.Subtitle, "vi")
                : null;

            banner.TitleTranslations    = JsonSerializer.Serialize(titleTrans);
            banner.SubtitleTranslations = subtitleTrans is not null
                ? JsonSerializer.Serialize(subtitleTrans)
                : null;
            banner.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return (true, null);
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private static BannerDto ToDto(Banner b) => new(
        b.BannerId,
        b.Title,
        b.Subtitle,
        b.ImageUrl,
        b.LinkUrl,
        b.DisplayTarget,
        b.StartDate,
        b.EndDate,
        b.IsActive,
        b.SortOrder,
        b.TitleTranslations,
        b.SubtitleTranslations,
        b.CreatedByAccountId,
        b.CreatedAt,
        b.UpdatedAt
    );
}
