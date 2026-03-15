using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly AppDbContext _db;
        public CategoryRepository(AppDbContext db) => _db = db;

        public Task<List<Category>> GetAllAsync() =>
            _db.Categories.AsNoTracking()
                .Include(c => c.CategoryPois)
                .ToListAsync();

        public Task<Category?> GetByIdAsync(string categoryId) =>
            _db.Categories.AsNoTracking()
                .Include(c => c.CategoryPois)
                .FirstOrDefaultAsync(c => c.CategoryId == categoryId);

        public async Task<Category> CreateAsync(Category category)
        {
            _db.Categories.Add(category);
            await _db.SaveChangesAsync();
            return category;
        }

        public async Task<Category?> UpdateAsync(Category category)
        {
            var existing = await _db.Categories.FindAsync(category.CategoryId);
            if (existing is null) return null;
            existing.Name = category.Name;
            existing.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(string categoryId)
        {
            var category = await _db.Categories.FindAsync(categoryId);
            if (category is null) return false;
            _db.Categories.Remove(category);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task AddPoiAsync(string categoryId, string poiId)
        {
            var exists = await _db.CategoryPois
                .AnyAsync(cp => cp.CategoryId == categoryId && cp.PoiId == poiId);
            if (!exists)
            {
                _db.CategoryPois.Add(new CategoryPoi { CategoryId = categoryId, PoiId = poiId });
                await _db.SaveChangesAsync();
            }
        }

        public async Task RemovePoiAsync(string categoryId, string poiId)
        {
            var entry = await _db.CategoryPois
                .FirstOrDefaultAsync(cp => cp.CategoryId == categoryId && cp.PoiId == poiId);
            if (entry is not null)
            {
                _db.CategoryPois.Remove(entry);
                await _db.SaveChangesAsync();
            }
        }
    }
}
