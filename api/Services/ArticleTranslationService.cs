using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services
{
    public class ArticleTranslationService : IArticleTranslationService
    {
        private readonly AppDbContext _db;
        private readonly ITranslationService _translator;

        public ArticleTranslationService(AppDbContext db, ITranslationService translator)
        {
            _db = db;
            _translator = translator;
        }

        public async Task TranslateArticleAsync(string articleId)
        {
            try
            {
                var article = await _db.Articles
                    .Include(a => a.Contents)
                    .FirstOrDefaultAsync(a => a.ArticleId == articleId);

                if (article == null) return;

                var viContent = article.Contents.FirstOrDefault(c => c.Lang == "vi");
                if (viContent == null) return;

                // Supported target languages: en, ja, ko, fr, de, zh (mapped to zh-Hans in Azure Translator)
                var targetLanguages = new[] { "en", "ja", "ko", "fr", "de", "zh" };

                foreach (var lang in targetLanguages)
                {
                    try
                    {
                        var azureLangCode = lang == "zh" ? "zh-Hans" : lang;

                        var titleTranslated = await _translator.TranslateAsync(viContent.Title, "vi", azureLangCode);
                        var summaryTranslated = await _translator.TranslateAsync(viContent.Summary, "vi", azureLangCode);
                        
                        string? bodyTranslated = null;
                        if (!string.IsNullOrEmpty(viContent.Body))
                        {
                            bodyTranslated = await _translator.TranslateAsync(viContent.Body, "vi", azureLangCode);
                        }

                        var existing = article.Contents.FirstOrDefault(c => c.Lang == lang);
                        if (existing != null)
                        {
                            existing.Title = titleTranslated;
                            existing.Summary = summaryTranslated;
                            existing.Body = bodyTranslated;
                        }
                        else
                        {
                            _db.ArticleContents.Add(new ArticleContent
                            {
                                ArticleId = articleId,
                                Lang = lang,
                                Title = titleTranslated,
                                Summary = summaryTranslated,
                                Body = bodyTranslated
                            });
                        }
                    }
                    catch (Exception langEx)
                    {
                        Console.WriteLine($"[ArticleTranslationService] Failed to translate {lang}: {langEx.Message}");
                    }
                }

                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ArticleTranslationService] Critical translation failure for article {articleId}: {ex.Message}");
            }
        }
    }
}
