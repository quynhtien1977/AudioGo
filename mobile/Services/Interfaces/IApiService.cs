using Shared;
using Shared.DTOs;

namespace AudioGo.Services.Interfaces
{
    public interface IApiService
    {
        Task<List<POI>> GetPoisAsync(string? languageCode = null, string? query = null, string? category = null, CancellationToken ct = default);
        Task<List<TourSummaryDto>> GetToursAsync(string? languageCode = null, string? query = null, CancellationToken ct = default);
        Task<List<CategoryDto>> GetCategoriesAsync(string languageCode = "vi", CancellationToken ct = default);
        Task PostListenHistoryAsync(string poiId, string deviceId, int durationSeconds, CancellationToken ct = default);
        Task PostLocationLogAsync(string deviceId, double latitude, double longitude, CancellationToken ct = default);
        Task<TourDetailDto?> GetTourByIdAsync(string tourId, string lang = "vi", CancellationToken ct = default);
        Task<(bool IsSuccess, string Message, string? Token)> ScanQrAsync(string code, string deviceId, CancellationToken ct = default);

        /// <summary>Lấy delta thay đổi kể từ <paramref name="since"/> (UTC). Trả null nếu lỗi network.</summary>
        Task<PoiDeltaDto?> GetDeltaAsync(DateTime since, string languageCode, CancellationToken ct = default);

        // ── Tourist Access Payment ─────────────────────────────────────────────
        /// <summary>Khởi tạo giao dịch thanh toán du khách. Trả null nếu lỗi network.</summary>
        Task<TouristPaymentInitResult?> InitTouristPaymentAsync(string deviceId, CancellationToken ct = default);

        /// <summary>Kiểm tra trạng thái thanh toán (poll mỗi 5s). Trả null nếu lỗi network.</summary>
        Task<TouristPaymentVerifyResult?> VerifyTouristPaymentAsync(string transactionId, string deviceId, CancellationToken ct = default);
    }

    // ── DTOs ────────────────────────────────────────────────────────────────
    public record TouristPaymentInitResult(
        string  TransactionId,
        decimal Amount,
        int     DurationDays,
        string  BankAccount,
        string  BankName,
        string  TransferContent,
        string  VietQrUrl,
        int     ExpireInMinutes
    );

    public record TouristPaymentVerifyResult(
        string  Status,     // "PENDING" | "SUCCESS" | "FAILED"
        string  Message,
        string? Token       // JWT — chỉ có khi Status == "SUCCESS"
    );
}

