using Server.Models;

namespace Server.Repositories.Interfaces
{
    public interface IPoiRepository
    {
        /// <summary>Chỉ trả về POI có status="published" (dùng cho Mobile).</summary>
        Task<List<Poi>> GetAllAsync();
        /// <summary>Tìm kiếm POI theo từ khóa và/hoặc category (dùng cho Mobile Search).</summary>
        Task<List<Poi>> SearchAsync(string? query, string? category);
        Task<Poi?> GetByIdAsync(string poiId);
        Task<List<Poi>> GetNearbyAsync(double lat, double lon, double radiusMeters);
        /// <summary>Trả về tất cả POI không filter status (dùng cho CMS).</summary>
        Task<List<Poi>> GetAllForCmsAsync(string? status = null);
        Task<Poi> CreateAsync(Poi poi);
        Task<Poi?> UpdateAsync(Poi poi);
        Task<bool> DeleteAsync(string poiId);
    }
}
