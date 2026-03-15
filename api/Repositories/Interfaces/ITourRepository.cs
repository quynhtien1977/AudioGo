using Server.Models;

namespace Server.Repositories.Interfaces
{
    public interface ITourRepository
    {
        Task<List<Tour>> GetAllAsync();
        Task<Tour?> GetByIdAsync(string tourId);
        Task<Tour> CreateAsync(Tour tour);
        Task<Tour?> UpdateAsync(Tour tour);
        Task<bool> DeleteAsync(string tourId);
        Task AddPoiAsync(string tourId, string poiId, int stepOrder);
        Task RemovePoiAsync(string tourId, string poiId);
        Task ReorderPoiAsync(string tourId, string poiId, int newOrder);
    }
}
