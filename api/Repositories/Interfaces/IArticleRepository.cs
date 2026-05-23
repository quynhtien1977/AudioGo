using System.Collections.Generic;
using System.Threading.Tasks;
using Server.Models;

namespace Server.Repositories.Interfaces
{
    public interface IArticleRepository
    {
        Task<List<Article>> GetByTypeAsync(string type, string lang, int limit = 10);
        Task<Article?> GetByIdAsync(string articleId);
        Task<Article?> GetByIdWithLangAsync(string articleId, string lang);
        Task<List<Article>> GetAllCmsAsync(string? type, string lang);
        Task<Article> CreateAsync(Article article);
        Task<Article?> UpdateAsync(Article article);
        Task<bool> DeleteAsync(string articleId);
    }
}
