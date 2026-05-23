using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Server.Controllers.Mobile
{
    [ApiController]
    [Route("api/mobile/articles")]
    [EnableCors("MobilePolicy")]
    [AllowAnonymous]
    public class ArticleMobileController : ControllerBase
    {
        private readonly IArticleRepository _repo;

        public ArticleMobileController(IArticleRepository repo)
        {
            _repo = repo;
        }

        /// <summary>
        /// GET /api/mobile/articles?type=tip&lang=vi&limit=10
        /// Public list; only returns metadata, title, and summary (body is null or omitted).
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<ArticleItemDto>>> GetArticles([FromQuery] string type = "tip", [FromQuery] string lang = "vi", [FromQuery] int limit = 10)
        {
            var articles = await _repo.GetByTypeAsync(type, lang, limit);
            var dtos = articles.Select(a => {
                var content = a.Contents.FirstOrDefault();
                return new ArticleItemDto
                {
                    ArticleId = a.ArticleId,
                    Type = a.Type,
                    ImageUrl = a.ImageUrl,
                    Title = content?.Title ?? string.Empty,
                    Summary = content?.Summary ?? string.Empty,
                    Body = null, // Body is excluded for list views to save bandwidth/local db storage
                    PublishedAt = a.PublishedAt
                };
            }).ToList();

            return Ok(dtos);
        }

        /// <summary>
        /// GET /api/mobile/articles/{id}?lang=vi
        /// Public detail; returns Title, Summary, and full Body.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ArticleItemDto>> GetArticleDetail(string id, [FromQuery] string lang = "vi")
        {
            var article = await _repo.GetByIdWithLangAsync(id, lang);
            if (article == null || !article.IsActive)
            {
                return NotFound();
            }

            var content = article.Contents.FirstOrDefault();
            var dto = new ArticleItemDto
            {
                ArticleId = article.ArticleId,
                Type = article.Type,
                ImageUrl = article.ImageUrl,
                Title = content?.Title ?? string.Empty,
                Summary = content?.Summary ?? string.Empty,
                Body = content?.Body,
                PublishedAt = article.PublishedAt
            };

            return Ok(dto);
        }
    }
}
