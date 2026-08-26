using Shared.DTOs;

namespace Server.Services.Interfaces
{
    /// <summary>
    /// Tách toàn bộ business logic của AccessCode ra khỏi CmsAccessCodeController.
    /// </summary>
    public interface IAccessCodeService
    {
        /// <summary>Lấy danh sách mã với phân trang, mới nhất trước.</summary>
        Task<PagedResult<AccessCodeDto>> GetPagedAsync(int page, int pageSize);

        /// <summary>
        /// Sinh hàng loạt mã ngẫu nhiên (tối đa 100 mã/lần).
        /// Trả về (danh sách mã đã tạo, errorMessage).
        /// </summary>
        Task<(List<AccessCodeDto> Created, string? Error)> CreateCodesAsync(int count);

        /// <summary>
        /// Xoá một mã theo ID.
        /// Trả về false nếu không tìm thấy.
        /// </summary>
        Task<bool> DeleteCodeAsync(int id);
    }
}
