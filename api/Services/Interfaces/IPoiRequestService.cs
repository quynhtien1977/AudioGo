using Shared.DTOs;

namespace Server.Services.Interfaces
{
    public interface IPoiRequestService
    {
        Task<List<PoiRequestListDto>> GetMyPoiRequestsAsync(string accountId, string? status = null);
        Task<object?> GetPoiRequestDetailAsync(string requestId);
        Task<string> SubmitPoiRequestAsync(string accountId, SubmitPoiRequestDto req);
        Task<List<PoiRequestListDto>> GetAllPoiRequestsAsync(string? status = "PENDING");
        Task<object> GetRequestStatsAsync();
        Task<ReviewPoiResult> ReviewPoiRequestAsync(string requestId, ReviewPoiRequestDto reviewData);
    }

    public class ReviewPoiResult
    {
        public bool Success { get; set; }
        public bool NotFound { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Detail { get; set; }
        public string? RequestId { get; set; }
        public string? Status { get; set; }
    }
}
