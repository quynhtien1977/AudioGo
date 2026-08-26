using Shared.DTOs;

namespace Server.Services.Interfaces
{
    /// <summary>
    /// Tách toàn bộ payment query logic ra khỏi CmsPaymentController.
    /// Admin thấy tất cả; Owner chỉ thấy giao dịch của chính mình.
    /// </summary>
    public interface IPaymentQueryService
    {
        /// <summary>
        /// Lấy danh sách giao dịch có filter + phân trang (Admin only).
        /// </summary>
        Task<PagedResult<PaymentSummaryDto>> GetAllAsync(PaymentFilter filter);

        /// <summary>
        /// Lấy danh sách giao dịch của chính Owner đang đăng nhập.
        /// </summary>
        Task<PagedResult<MyPaymentDto>> GetMyAsync(string accountId, int page, int pageSize);

        /// <summary>
        /// Lấy chi tiết một giao dịch theo TransactionId.
        /// Trả về null nếu không tìm thấy.
        /// </summary>
        Task<PaymentDetailDto?> GetByIdAsync(string transactionId);
    }
}
