namespace Shared.DTOs
{
    /// <summary>DTO đại diện cho một mã truy cập trong hệ thống.</summary>
    public record AccessCodeDto(
        int       CodeId,
        string    Code,
        string    Type,
        string?   PlanId,
        int?      DurationDay,
        string?   UsedByDeviceId,
        DateTime? ActivatedAt,
        DateTime? ExpireAt,
        DateTime  CreatedAt);

    /// <summary>Thông tin phân trang metadata.</summary>
    public record PaginationMeta(
        int TotalItems,
        int TotalPages,
        int CurrentPage,
        int PageSize)
    {
        public int Total => TotalItems;
        public int Page => CurrentPage;
    }

    /// <summary>Wrapper phân trang chuẩn cho Frontend CMS ({ data: [...], pagination: { ... } }).</summary>
    public record PagedResult<T>(
        IReadOnlyList<T> Data,
        PaginationMeta Pagination)
    {
        public PagedResult(IReadOnlyList<T> data, int totalItems, int totalPages, int currentPage, int pageSize)
            : this(data, new PaginationMeta(totalItems, totalPages, currentPage, pageSize))
        {
        }
    }
}
