using System;
using System.Collections.Generic;

namespace Shared.DTOs
{
    /// <summary>Response DTO cho mobile hiển thị card + detail.</summary>
    public class ArticleItemDto
    {
        public string ArticleId { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string? Body { get; set; } // Chỉ có khi get detail
        public DateTime PublishedAt { get; set; }
    }

    /// <summary>Request khi Admin tạo / cập nhật bài viết.</summary>
    public class ArticleUpsertDto
    {
        public string Type { get; set; } = "tip";
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
        // Key = lang code ("vi"), Value = content
        public Dictionary<string, ArticleContentDto> Contents { get; set; } = new();
    }

    public class ArticleContentDto
    {
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string? Body { get; set; }
    }
}
