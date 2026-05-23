using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories
{
    public class ArticleRepository : IArticleRepository
    {
        private readonly AppDbContext _db;
        public ArticleRepository(AppDbContext db) => _db = db;

        public async Task<List<Article>> GetByTypeAsync(string type, string lang, int limit = 10)
        {
            var articles = await _db.Articles
                .AsNoTracking()
                .Where(a => a.Type == type && a.IsActive && a.DeletedAt == null)
                .OrderByDescending(a => a.PublishedAt)
                .Take(limit)
                .Include(a => a.Contents)
                .ToListAsync();

            foreach (var a in articles)
            {
                var resolvedContent = a.Contents.FirstOrDefault(c => c.Lang == lang) 
                                      ?? a.Contents.FirstOrDefault(c => c.Lang == "vi");
                
                a.Contents = resolvedContent != null 
                    ? new List<ArticleContent> { resolvedContent } 
                    : new List<ArticleContent>();
            }

            return articles;
        }

        public async Task<Article?> GetByIdAsync(string articleId)
        {
            return await _db.Articles
                .Include(a => a.Contents)
                .FirstOrDefaultAsync(a => a.ArticleId == articleId && a.DeletedAt == null);
        }

        public async Task<Article?> GetByIdWithLangAsync(string articleId, string lang)
        {
            var article = await _db.Articles
                .AsNoTracking()
                .Include(a => a.Contents)
                .FirstOrDefaultAsync(a => a.ArticleId == articleId && a.DeletedAt == null);

            if (article != null)
            {
                var resolvedContent = article.Contents.FirstOrDefault(c => c.Lang == lang)
                                      ?? article.Contents.FirstOrDefault(c => c.Lang == "vi");

                article.Contents = resolvedContent != null 
                    ? new List<ArticleContent> { resolvedContent } 
                    : new List<ArticleContent>();
            }

            return article;
        }

        public async Task<Article> CreateAsync(Article article)
        {
            _db.Articles.Add(article);
            await _db.SaveChangesAsync();
            return article;
        }

        public async Task<Article?> UpdateAsync(Article article)
        {
            var existing = await _db.Articles
                .Include(a => a.Contents)
                .FirstOrDefaultAsync(a => a.ArticleId == article.ArticleId);

            if (existing is null) return null;

            existing.Type = article.Type;
            existing.ImageUrl = article.ImageUrl;
            existing.IsActive = article.IsActive;
            existing.SortOrder = article.SortOrder;
            existing.UpdatedAt = DateTime.UtcNow;

            // Update ArticleContent collection instead of deleting to prevent tracking issues and preserve other translations
            foreach (var incomingContent in article.Contents)
            {
                var existingContent = existing.Contents.FirstOrDefault(c => c.Lang == incomingContent.Lang);
                if (existingContent != null)
                {
                    existingContent.Title = incomingContent.Title;
                    existingContent.Summary = incomingContent.Summary;
                    existingContent.Body = incomingContent.Body;
                }
                else
                {
                    incomingContent.ArticleId = existing.ArticleId;
                    existing.Contents.Add(incomingContent);
                }
            }

            await _db.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(string articleId)
        {
            var article = await _db.Articles.FindAsync(articleId);
            if (article is null) return false;
            article.DeletedAt = DateTime.UtcNow;
            article.IsActive = false;
            article.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<List<Article>> GetAllCmsAsync(string? type, string lang)
        {
            IQueryable<Article> query = _db.Articles.AsNoTracking().Where(a => a.DeletedAt == null);
            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(a => a.Type == type);
            }

            var articles = await query
                .OrderBy(a => a.SortOrder)
                .ThenByDescending(a => a.PublishedAt)
                .Include(a => a.Contents)
                .ToListAsync();

            foreach (var a in articles)
            {
                var resolvedContent = a.Contents.FirstOrDefault(c => c.Lang == lang) 
                                      ?? a.Contents.FirstOrDefault(c => c.Lang == "vi");
                
                a.Contents = resolvedContent != null 
                    ? new List<ArticleContent> { resolvedContent } 
                    : new List<ArticleContent>();
            }

            return articles;
        }
    }
}
