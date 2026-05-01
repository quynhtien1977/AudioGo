using Server.Models;

namespace Server.Repositories.Interfaces
{
    public interface ITourRepository
    {
        /// <summary>Chỉ trả về tour IsActive = true (dùng cho Mobile + CMS list mặc định).</summary>
        Task<List<Tour>> GetAllAsync();
        /// <summary>Trả về tất cả tour kể cả đã ẩn — dùng cho CMS quản lý.</summary>
        Task<List<Tour>> GetAllIncludingInactiveAsync();
        Task<Tour?> GetByIdAsync(string tourId);
        Task<Tour> CreateAsync(Tour tour);
        Task<Tour?> UpdateAsync(Tour tour);
        /// <summary>Soft-delete: set IsActive = false.</summary>
        Task<bool> DeleteAsync(string tourId);
        /// <summary>Restore: set IsActive = true.</summary>
        Task<bool> RestoreAsync(string tourId);
        Task AddPoiAsync(string tourId, string poiId, int stepOrder);
        Task RemovePoiAsync(string tourId, string poiId);
        Task ReorderPoiAsync(string tourId, string poiId, int newOrder);
    }
}
