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
                .Where(a => a.Type == type && a.IsActive)
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
                .FirstOrDefaultAsync(a => a.ArticleId == articleId);
        }

        public async Task<Article?> GetByIdWithLangAsync(string articleId, string lang)
        {
            var article = await _db.Articles
                .Include(a => a.Contents)
                .FirstOrDefaultAsync(a => a.ArticleId == articleId);

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
            existing.PublishedAt = article.PublishedAt;
            existing.UpdatedAt = DateTime.UtcNow;

            _db.ArticleContents.RemoveRange(existing.Contents);
            foreach (var content in article.Contents)
            {
                content.ArticleId = existing.ArticleId;
                _db.ArticleContents.Add(content);
            }

            await _db.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(string articleId)
        {
            var article = await _db.Articles.FindAsync(articleId);
            if (article is null) return false;
            _db.Articles.Remove(article);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
