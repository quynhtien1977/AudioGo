using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;
using Shared.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/articles")]
    [Authorize(Roles = "Admin")]
    public class CmsArticleController : ControllerBase
    {
        private readonly IArticleRepository _repo;
        private readonly IServiceScopeFactory _scopeFactory;

        public CmsArticleController(IArticleRepository repo, IServiceScopeFactory scopeFactory)
        {
            _repo = repo;
            _scopeFactory = scopeFactory;
        }

        // GET — cho phép Editor đọc bài viết (class-level giới hạn Admin, override tại đây)
        [HttpGet]
        [Authorize(Roles = "Admin,Editor")]
        public async Task<ActionResult<List<ArticleItemDto>>> GetAll([FromQuery] string? type)
        {
            var articles = await _repo.GetAllCmsAsync(type, "vi");
            return Ok(articles.Select(a => ToItemDto(a)).ToList());
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Editor")]
        public async Task<ActionResult<ArticleUpsertDto>> GetById(string id)
        {
            var article = await _repo.GetByIdAsync(id);
            if (article is null) return NotFound();

            var dto = new ArticleUpsertDto
            {
                Type = article.Type,
                ImageUrl = article.ImageUrl,
                IsActive = article.IsActive,
                SortOrder = article.SortOrder,
                Contents = article.Contents.ToDictionary(
                    c => c.Lang,
                    c => new ArticleContentDto
                    {
                        Title = c.Title,
                        Summary = c.Summary,
                        Body = c.Body
                    })
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<ArticleItemDto>> Create([FromBody] ArticleUpsertDto req)
        {
            if (req is null || !req.Contents.TryGetValue("vi", out var viContent))
            {
                return BadRequest("Nội dung Tiếng Việt (vi) là bắt buộc.");
            }

            if (string.IsNullOrWhiteSpace(viContent.Title))
            {
                return BadRequest("Tiêu đề bài viết không được để trống.");
            }

            if (string.IsNullOrWhiteSpace(viContent.Summary))
            {
                return BadRequest("Tóm tắt ngắn không được để trống.");
            }

            if (string.IsNullOrWhiteSpace(viContent.Body))
            {
                return BadRequest("Nội dung chi tiết không được để trống.");
            }

            if (string.IsNullOrWhiteSpace(req.ImageUrl))
            {
                return BadRequest("Ảnh bìa bài viết không được để trống.");
            }

            // Resolve SortOrder default or collision
            var articlesOfSameType = await _repo.GetAllCmsAsync(req.Type, "vi");
            int finalSortOrder = req.SortOrder;
            if (finalSortOrder <= 0)
            {
                var currentMax = articlesOfSameType.Any() ? articlesOfSameType.Max(a => a.SortOrder) : 0;
                finalSortOrder = currentMax + 1;
            }
            else
            {
                while (articlesOfSameType.Any(a => a.SortOrder == finalSortOrder))
                {
                    finalSortOrder++;
                }
            }

            var article = new Article
            {
                ArticleId = Guid.NewGuid().ToString(),
                Type = req.Type,
                ImageUrl = req.ImageUrl,
                IsActive = req.IsActive,
                SortOrder = finalSortOrder,
                PublishedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var kvp in req.Contents)
            {
                article.Contents.Add(new ArticleContent
                {
                    ArticleId = article.ArticleId,
                    Lang = kvp.Key,
                    Title = kvp.Value.Title,
                    Summary = kvp.Value.Summary,
                    Body = kvp.Value.Body
                });
            }

            var created = await _repo.CreateAsync(article);

            _ = Task.Run(async () =>
            {
                using (var scope = _scopeFactory.CreateScope())
                {
                    var scopedTranslationService = scope.ServiceProvider.GetRequiredService<IArticleTranslationService>();
                    try
                    {
                        await scopedTranslationService.TranslateArticleAsync(created.ArticleId);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[CmsArticleController] Background translation failed: {ex.Message}");
                    }
                }
            });

            return CreatedAtAction(nameof(GetById), new { id = created.ArticleId }, ToItemDto(created));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ArticleItemDto>> Update(string id, [FromBody] ArticleUpsertDto req)
        {
            if (req is null || !req.Contents.TryGetValue("vi", out var viContent))
            {
                return BadRequest("Nội dung Tiếng Việt (vi) là bắt buộc.");
            }

            if (string.IsNullOrWhiteSpace(viContent.Title))
            {
                return BadRequest("Tiêu đề bài viết không được để trống.");
            }

            if (string.IsNullOrWhiteSpace(viContent.Summary))
            {
                return BadRequest("Tóm tắt ngắn không được để trống.");
            }

            if (string.IsNullOrWhiteSpace(viContent.Body))
            {
                return BadRequest("Nội dung chi tiết không được để trống.");
            }

            if (string.IsNullOrWhiteSpace(req.ImageUrl))
            {
                return BadRequest("Ảnh bìa bài viết không được để trống.");
            }

            // Resolve SortOrder default or collision (excluding the current article ID)
            var articlesOfSameType = await _repo.GetAllCmsAsync(req.Type, "vi");
            var otherArticles = articlesOfSameType.Where(a => a.ArticleId != id).ToList();
            int finalSortOrder = req.SortOrder;
            if (finalSortOrder <= 0)
            {
                var currentMax = otherArticles.Any() ? otherArticles.Max(a => a.SortOrder) : 0;
                finalSortOrder = currentMax + 1;
            }
            else
            {
                while (otherArticles.Any(a => a.SortOrder == finalSortOrder))
                {
                    finalSortOrder++;
                }
            }

            var article = new Article
            {
                ArticleId = id,
                Type = req.Type,
                ImageUrl = req.ImageUrl,
                IsActive = req.IsActive,
                SortOrder = finalSortOrder,
                PublishedAt = DateTime.UtcNow
            };

            foreach (var kvp in req.Contents)
            {
                article.Contents.Add(new ArticleContent
                {
                    ArticleId = id,
                    Lang = kvp.Key,
                    Title = kvp.Value.Title,
                    Summary = kvp.Value.Summary,
                    Body = kvp.Value.Body
                });
            }

            var updated = await _repo.UpdateAsync(article);
            if (updated is null) return NotFound();

            _ = Task.Run(async () =>
            {
                using (var scope = _scopeFactory.CreateScope())
                {
                    var scopedTranslationService = scope.ServiceProvider.GetRequiredService<IArticleTranslationService>();
                    try
                    {
                        await scopedTranslationService.TranslateArticleAsync(id);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[CmsArticleController] Background translation failed: {ex.Message}");
                    }
                }
            });

            return Ok(ToItemDto(updated));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var ok = await _repo.DeleteAsync(id);
            return ok ? NoContent() : NotFound();
        }

        private static ArticleItemDto ToItemDto(Article a, string lang = "vi")
        {
            var content = a.Contents.FirstOrDefault(c => c.Lang == lang) 
                          ?? a.Contents.FirstOrDefault(c => c.Lang == "vi")
                          ?? a.Contents.FirstOrDefault();
            return new ArticleItemDto
            {
                ArticleId = a.ArticleId,
                Type = a.Type,
                ImageUrl = a.ImageUrl,
                Title = content?.Title ?? string.Empty,
                Summary = content?.Summary ?? string.Empty,
                Body = content?.Body,
                PublishedAt = a.PublishedAt,
                IsActive = a.IsActive,
                SortOrder = a.SortOrder
            };
        }
    }
}
