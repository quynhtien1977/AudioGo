using Server.Models;
using Shared.DTOs;

namespace Server.Repositories.Interfaces
{
    public interface IListenHistoryRepository
    {
        Task<ListenHistory> CreateAsync(ListenHistory entry);
        Task CreateBatchAsync(IEnumerable<ListenHistory> entries);
        Task<List<ListenHistory>> GetByPoiAsync(string poiId, int limit = 100);
        Task<List<(string PoiId, int Count)>> GetTopPoisAsync(int topN = 10);

        Task<int> GetTotalListensAsync();

        // cho chart
        Task<List<DailyListenDto>> GetDailyListensAsync(int? days = null);
    }
}
