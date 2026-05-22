using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        private readonly IArticleTranslationService _translationService;

        public CmsArticleController(IArticleRepository repo, IArticleTranslationService translationService)
        {
            _repo = repo;
            _translationService = translationService;
        }

        [HttpGet]
        public async Task<ActionResult<List<ArticleItemDto>>> GetAll([FromQuery] string? type)
        {
            var articles = await _repo.GetByTypeAsync(type ?? "tip", "vi", 100);
            return Ok(articles.Select(a => ToItemDto(a)).ToList());
        }

        [HttpGet("{id}")]
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
            if (req is null || !req.Contents.ContainsKey("vi"))
            {
                return BadRequest("Vietnamese (vi) content is required.");
            }

            var article = new Article
            {
                ArticleId = Guid.NewGuid().ToString(),
                Type = req.Type,
                ImageUrl = req.ImageUrl,
                IsActive = req.IsActive,
                SortOrder = req.SortOrder,
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
                try
                {
                    await _translationService.TranslateArticleAsync(created.ArticleId);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[CmsArticleController] Background translation failed: {ex.Message}");
                }
            });

            return CreatedAtAction(nameof(GetById), new { id = created.ArticleId }, ToItemDto(created));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ArticleItemDto>> Update(string id, [FromBody] ArticleUpsertDto req)
        {
            if (req is null || !req.Contents.ContainsKey("vi"))
            {
                return BadRequest("Vietnamese (vi) content is required.");
            }

            var article = new Article
            {
                ArticleId = id,
                Type = req.Type,
                ImageUrl = req.ImageUrl,
                IsActive = req.IsActive,
                SortOrder = req.SortOrder,
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
                try
                {
                    await _translationService.TranslateArticleAsync(id);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[CmsArticleController] Background translation failed: {ex.Message}");
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

        private static ArticleItemDto ToItemDto(Article a)
        {
            var content = a.Contents.FirstOrDefault();
            return new ArticleItemDto
            {
                ArticleId = a.ArticleId,
                Type = a.Type,
                ImageUrl = a.ImageUrl,
                Title = content?.Title ?? string.Empty,
                Summary = content?.Summary ?? string.Empty,
                Body = content?.Body,
                PublishedAt = a.PublishedAt
            };
        }
    }
}
