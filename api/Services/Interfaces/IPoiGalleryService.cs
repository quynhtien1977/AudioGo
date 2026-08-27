using Shared.DTOs;

namespace Server.Services.Interfaces;

public interface IPoiGalleryService
{
    Task<List<PoiGalleryDto>> GetAllAsync(string poiId);
    Task<PoiGalleryDto> CreateAsync(string poiId, PoiGalleryDto req);
    Task DeleteAsync(string poiId, string imageId);
}
