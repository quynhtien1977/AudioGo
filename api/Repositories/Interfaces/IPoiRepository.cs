using Server.Models;

namespace Server.Repositories.Interfaces
{
    public interface IPoiRepository
    {
        Task<List<Poi>> GetAllAsync();
        Task<Poi?> GetByIdAsync(string poiId);
        Task<List<Poi>> GetNearbyAsync(double lat, double lon, double radiusMeters);
        Task<Poi> CreateAsync(Poi poi);
        Task<Poi?> UpdateAsync(Poi poi);
        Task<bool> DeleteAsync(string poiId);
    }
}
