using Server.Models;

namespace Server.Repositories.Interfaces
{
    public interface ILocationLogRepository
    {
        Task CreateBatchAsync(IEnumerable<LocationLog> logs);
        Task<List<LocationLog>> GetByDeviceAsync(string deviceId, int limit = 200);
        Task<List<(double Lat, double Lon, int Count)>> GetHeatmapAsync();
    }
}
