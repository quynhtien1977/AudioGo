using Shared.DTOs;

namespace Server.Services.Interfaces;

public interface INotificationService
{
    /// <summary>Tạo 1 notification cho 1 recipient cụ thể (hoặc broadcast nếu recipientAccountId = null).</summary>
    Task<string> CreateAsync(
        string? recipientAccountId,
        string type,
        string title,
        string body,
        string? createdByAccountId = null);

    /// <summary>Broadcast tới tất cả account có role thuộc danh sách roles — fan-out N rows.</summary>
    Task BroadcastToRolesAsync(
        IEnumerable<string> roles,
        string title,
        string body,
        string? createdByAccountId = null);

    /// <summary>Lấy danh sách notification chưa đọc của recipient.</summary>
    Task<List<NotificationDto>> GetUnreadAsync(string recipientAccountId);

    /// <summary>Lấy toàn bộ notification (có phân trang) của recipient.</summary>
    Task<List<NotificationDto>> GetAllAsync(string recipientAccountId, int page = 1, int pageSize = 20);

    /// <summary>Đánh dấu đã đọc. Trả false nếu không tồn tại hoặc không phải của recipient này.</summary>
    Task<bool> MarkReadAsync(string notificationId, string recipientAccountId);

    /// <summary>Đánh dấu TẤT CẢ chưa đọc của recipient thành đã đọc.</summary>
    Task MarkAllReadAsync(string recipientAccountId);

    /// <summary>Lấy public broadcast (RecipientAccountId IS NULL) — dùng cho mobile.</summary>
    Task<List<NotificationDto>> GetPublicBroadcastsAsync(DateTime? since = null);

    /// <summary>Số lượng notification chưa đọc của recipient.</summary>
    Task<int> GetUnreadCountAsync(string recipientAccountId);

    /// <summary>Xóa 1 notification. Trả false nếu không tồn tại hoặc không phải của recipient này.</summary>
    Task<bool> DeleteAsync(string notificationId, string recipientAccountId);

    /// <summary>Xóa TẤT CẢ notification của recipient.</summary>
    Task DeleteAllAsync(string recipientAccountId);
}
