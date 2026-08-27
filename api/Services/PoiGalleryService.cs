using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Services;

/// <summary>Quản lý ảnh gallery của một POI.</summary>
public class PoiGalleryService : IPoiGalleryService
{
    private readonly AppDbContext _db;

    public PoiGalleryService(AppDbContext db) => _db = db;

    public async Task<List<PoiGalleryDto>> GetAllAsync(string poiId)
    {
        var images = await _db.PoiGalleries.AsNoTracking()
            .Where(g => g.PoiId == poiId)
            .OrderBy(g => g.SortOrder)
            .ToListAsync();

        return images.Select(g =>
            new PoiGalleryDto(g.ImageId, g.PoiId, g.ImageUrl, g.SortOrder)).ToList();
    }

    public async Task<PoiGalleryDto> CreateAsync(string poiId, PoiGalleryDto req)
    {
        var image = new PoiGallery
        {
            ImageId   = Guid.NewGuid().ToString(),
            PoiId     = poiId,
            ImageUrl  = req.ImageUrl,
            SortOrder = req.SortOrder
        };
        _db.PoiGalleries.Add(image);
        await _db.SaveChangesAsync();

        return new PoiGalleryDto(image.ImageId, image.PoiId, image.ImageUrl, image.SortOrder);
    }

    public async Task DeleteAsync(string poiId, string imageId)
    {
        var image = await _db.PoiGalleries
            .FirstOrDefaultAsync(g => g.ImageId == imageId && g.PoiId == poiId)
            ?? throw new KeyNotFoundException($"Không tìm thấy ảnh: {imageId}");

        _db.PoiGalleries.Remove(image);
        await _db.SaveChangesAsync();
    }
}
