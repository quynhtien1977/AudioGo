namespace Shared.DTOs;

// ── Notification DTOs ─────────────────────────────────────────────────────────

/// <summary>Notification item trả về cho client.</summary>
public record NotificationDto(
    string   NotificationId,
    string?  RecipientAccountId,
    string   Title,
    string   Body,
    string   Type,
    bool     IsRead,
    DateTime CreatedAt,
    string?  CreatedByAccountId
);

/// <summary>Admin tạo thông báo broadcast thủ công.</summary>
public record CreateBroadcastNotificationRequest(
    /// <summary>Danh sách role nhận thông báo: "Owner", "Editor", "Admin", hoặc "Public" cho mobile.</summary>
    List<string> TargetRoles,
    string Title,
    string Body
);

/// <summary>Đánh dấu đọc một hoặc tất cả.</summary>
public record MarkReadRequest(
    /// <summary>null = đánh dấu TẤT CẢ đã đọc.</summary>
    string? NotificationId = null
);
