using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Security.Claims;

namespace Server.Controllers.Cms;

/// <summary>
/// Notification nội bộ CMS — Admin gửi thông báo, Owner/Editor đọc.
/// </summary>
[ApiController]
[Route("api/cms/notifications")]
[Authorize]
[EnableCors("WebCmsPolicy")]
public class CmsNotificationController : ControllerBase
{
    private readonly INotificationService _notifications;

    public CmsNotificationController(INotificationService notifications)
    {
        _notifications = notifications;
    }

    // ── GET: Notification chưa đọc của user hiện tại ──────────────────────
    // GET /api/cms/notifications/unread
    [HttpGet("unread")]
    public async Task<IActionResult> GetUnread()
    {
        var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(accountId)) return Unauthorized();

        var list = await _notifications.GetUnreadAsync(accountId);
        return Ok(list);
    }

    // ── GET: Số lượng chưa đọc (dùng cho badge polling) ──────────────────
    // GET /api/cms/notifications/unread/count
    [HttpGet("unread/count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(accountId)) return Unauthorized();

        var count = await _notifications.GetUnreadCountAsync(accountId);
        return Ok(new { count });
    }

    // ── GET: Tất cả notification có phân trang ───────────────────────────
    // GET /api/cms/notifications?page=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20)
    {
        var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(accountId)) return Unauthorized();

        var list = await _notifications.GetAllAsync(accountId, page, pageSize);
        return Ok(list);
    }

    // ── POST: Admin tạo broadcast thủ công ───────────────────────────────
    // POST /api/cms/notifications
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [EnableRateLimiting("cmsWrite")]
    public async Task<IActionResult> CreateBroadcast([FromBody] CreateBroadcastNotificationRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { error = "Title is required" });

        if (string.IsNullOrWhiteSpace(req.Body))
            return BadRequest(new { error = "Body is required" });

        if (req.TargetRoles is null || !req.TargetRoles.Any())
            return BadRequest(new { error = "TargetRoles is required" });

        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        await _notifications.BroadcastToRolesAsync(
            req.TargetRoles,
            req.Title,
            req.Body,
            adminId);

        return Ok(new { message = "Thông báo đã được gửi thành công" });
    }

    // ── PATCH: Đánh dấu đã đọc (1 hoặc tất cả) ──────────────────────────
    // PATCH /api/cms/notifications/read
    [HttpPatch("read")]
    public async Task<IActionResult> MarkRead([FromBody] MarkReadRequest req)
    {
        var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(accountId)) return Unauthorized();

        if (req.NotificationId is null)
        {
            // Đánh dấu TẤT CẢ đã đọc
            await _notifications.MarkAllReadAsync(accountId);
            return Ok(new { message = "Đã đánh dấu tất cả là đã đọc" });
        }

        var ok = await _notifications.MarkReadAsync(req.NotificationId, accountId);
        if (!ok) return NotFound(new { error = "Notification không tồn tại hoặc không thuộc về bạn" });

        return Ok(new { message = "Đã đánh dấu đã đọc" });
    }

    // ── DELETE: Xóa 1 notification ─────────────────────────────────────────
    // DELETE /api/cms/notifications/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(accountId)) return Unauthorized();

        var ok = await _notifications.DeleteAsync(id, accountId);
        if (!ok) return NotFound(new { error = "Notification không tồn tại hoặc không thuộc về bạn" });

        return Ok(new { message = "Đã xóa thông báo" });
    }

    // ── DELETE: Xóa TẤT CẢ notification của user ───────────────────────────
    // DELETE /api/cms/notifications
    [HttpDelete]
    public async Task<IActionResult> DeleteAll()
    {
        var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(accountId)) return Unauthorized();

        await _notifications.DeleteAllAsync(accountId);
        return Ok(new { message = "Đã xóa toàn bộ thông báo" });
    }
}
