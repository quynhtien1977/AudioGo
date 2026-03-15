using Server.Models;

namespace Server.Repositories.Interfaces
{
    public interface ICategoryRepository
    {
        Task<List<Category>> GetAllAsync();
        Task<Category?> GetByIdAsync(string categoryId);
        Task<Category> CreateAsync(Category category);
        Task<Category?> UpdateAsync(Category category);
        Task<bool> DeleteAsync(string categoryId);
        Task AddPoiAsync(string categoryId, string poiId);
        Task RemovePoiAsync(string categoryId, string poiId);
    }
}
