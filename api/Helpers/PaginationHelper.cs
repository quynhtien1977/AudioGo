namespace Server.Helpers
{
    /// <summary>
    /// Chuẩn hoá tham số phân trang để tránh crash 500 khi client truyền giá trị bất hợp lệ.
    /// </summary>
    public static class PaginationHelper
    {
        /// <summary>
        /// Clamp page và pageSize về khoảng hợp lệ.
        /// </summary>
        /// <param name="page">Trang hiện tại (>=1).</param>
        /// <param name="pageSize">Số phần tử / trang (1–maxPageSize).</param>
        /// <param name="maxPageSize">Giới hạn tối đa pageSize (default 100).</param>
        public static (int Page, int PageSize) Normalize(int page, int pageSize, int maxPageSize = 100)
        {
            var safePage     = Math.Max(1, page);
            var safePageSize = Math.Clamp(pageSize, 1, maxPageSize);
            return (safePage, safePageSize);
        }
    }
}
