using System.Threading.Tasks;

namespace Server.Services.Interfaces
{
    public interface IArticleTranslationService
    {
        Task TranslateArticleAsync(string articleId);
    }
}
