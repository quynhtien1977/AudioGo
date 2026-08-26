using Shared.DTOs;

namespace Server.Services.Interfaces
{
    /// <summary>
    /// Tách toàn bộ complex analytics queries ra khỏi AnalyticsController.
    /// Mỗi method đại diện cho một analytics use-case rõ ràng.
    /// </summary>
    public interface IAnalyticsService
    {
        /// <summary>
        /// Top N POI được nghe nhiều nhất.
        /// Admin thấy toàn bộ; Owner chỉ thấy POI thuộc account của mình.
        /// </summary>
        Task<List<TopPoiDto>> GetTopPoisAsync(string? accountId, bool isOwner, int top = 10);

        /// <summary>
        /// Thống kê tổng lượt nghe + danh sách lượt nghe theo ngày.
        /// Admin thấy toàn hệ thống; Owner chỉ thấy POI của mình.
        /// </summary>
        Task<DashboardStatsDto> GetListenStatsAsync(string? accountId, bool isOwner, int? days);

        /// <summary>
        /// Timeline hoạt động của một thiết bị: hợp nhất LocationLog + ListenHistory → sắp theo thời gian.
        /// </summary>
        Task<DeviceActivityDto> GetDeviceActivityAsync(string deviceId, int days = 7);
    }
}
