using Server.Models;

namespace Server.Repositories.Interfaces
{
    public interface IListenHistoryRepository
    {
        Task<ListenHistory> CreateAsync(ListenHistory entry);
        Task<List<ListenHistory>> GetByPoiAsync(string poiId, int limit = 100);
        Task<List<(string PoiId, int Count)>> GetTopPoisAsync(int topN = 10);
    }
}
