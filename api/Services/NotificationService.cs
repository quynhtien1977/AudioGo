using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(AppDbContext db, ILogger<NotificationService> logger)
        {
            _db     = db;
            _logger = logger;
        }

        // ── Map Model → DTO ──────────────────────────────────────────────────
        private static NotificationDto ToDto(Notification n) => new(
            n.NotificationId,
            n.RecipientAccountId,
            n.Title,
            n.Body,
            n.Type,
            n.IsRead,
            n.CreatedAt,
            n.CreatedByAccountId
        );

        // ── CREATE ───────────────────────────────────────────────────────────

        /// <inheritdoc/>
        public async Task<string> CreateAsync(
            string? recipientAccountId,
            string type,
            string title,
            string body,
            string? createdByAccountId = null)
        {
            var notification = new Notification
            {
                NotificationId     = Guid.NewGuid().ToString(),
                RecipientAccountId = recipientAccountId,
                Title              = title,
                Body               = body,
                Type               = type,
                IsRead             = false,
                CreatedAt          = DateTime.UtcNow,
                CreatedByAccountId = createdByAccountId
            };

            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "📢 Notification created [{Type}] → recipient={RecipientId} | id={Id}",
                type, recipientAccountId ?? "PUBLIC", notification.NotificationId);

            return notification.NotificationId;
        }

        /// <inheritdoc/>
        public async Task BroadcastToRolesAsync(
            IEnumerable<string> roles,
            string title,
            string body,
            string? createdByAccountId = null)
        {
            var roleList = roles.ToList();

            // "Public" = broadcast không cần account (mobile tourists)
            if (roleList.Contains("Public"))
            {
                await CreateAsync(null, "Broadcast", title, body, createdByAccountId);
                roleList = roleList.Where(r => r != "Public").ToList();
            }

            if (!roleList.Any()) return;

            // Fan-out: lấy tất cả AccountId có role trong danh sách
            var recipientIds = await _db.Accounts
                .Where(a => roleList.Contains(a.Role) && a.DeletedAt == null)
                .Select(a => a.AccountId)
                .ToListAsync();

            if (!recipientIds.Any())
            {
                _logger.LogWarning("BroadcastToRoles: no accounts found for roles [{Roles}]", string.Join(",", roleList));
                return;
            }

            var notifications = recipientIds.Select(id => new Notification
            {
                NotificationId     = Guid.NewGuid().ToString(),
                RecipientAccountId = id,
                Title              = title,
                Body               = body,
                Type               = "Broadcast",
                IsRead             = false,
                CreatedAt          = DateTime.UtcNow,
                CreatedByAccountId = createdByAccountId
            }).ToList();

            _db.Notifications.AddRange(notifications);
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "📢 Broadcast [{Title}] → {Count} recipients (roles: {Roles})",
                title, notifications.Count, string.Join(",", roleList));
        }

        // ── READ ─────────────────────────────────────────────────────────────

        /// <inheritdoc/>
        public async Task<List<NotificationDto>> GetUnreadAsync(string recipientAccountId)
        {
            var list = await _db.Notifications
                .Where(n => n.RecipientAccountId == recipientAccountId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            return list.Select(ToDto).ToList();
        }

        /// <inheritdoc/>
        public async Task<List<NotificationDto>> GetAllAsync(string recipientAccountId, int page = 1, int pageSize = 20)
        {
            var list = await _db.Notifications
                .Where(n => n.RecipientAccountId == recipientAccountId)
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();

            return list.Select(ToDto).ToList();
        }

        /// <inheritdoc/>
        public async Task<int> GetUnreadCountAsync(string recipientAccountId)
        {
            return await _db.Notifications
                .CountAsync(n => n.RecipientAccountId == recipientAccountId && !n.IsRead);
        }

        /// <inheritdoc/>
        public async Task<List<NotificationDto>> GetPublicBroadcastsAsync(DateTime? since = null)
        {
            var query = _db.Notifications
                .Where(n => n.RecipientAccountId == null);

            if (since.HasValue)
                query = query.Where(n => n.CreatedAt > since.Value);

            var list = await query
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .AsNoTracking()
                .ToListAsync();

            return list.Select(ToDto).ToList();
        }

        // ── MARK READ ────────────────────────────────────────────────────────

        /// <inheritdoc/>
        public async Task<bool> MarkReadAsync(string notificationId, string recipientAccountId)
        {
            var notification = await _db.Notifications
                .FirstOrDefaultAsync(n =>
                    n.NotificationId     == notificationId &&
                    n.RecipientAccountId == recipientAccountId);

            if (notification is null) return false;

            notification.IsRead = true;
            await _db.SaveChangesAsync();
            return true;
        }

        /// <inheritdoc/>
        public async Task MarkAllReadAsync(string recipientAccountId)
        {
            await _db.Notifications
                .Where(n => n.RecipientAccountId == recipientAccountId && !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        }

        // ── DELETE ───────────────────────────────────────────────────────────

        /// <inheritdoc/>
        public async Task<bool> DeleteAsync(string notificationId, string recipientAccountId)
        {
            var notification = await _db.Notifications
                .FirstOrDefaultAsync(n =>
                    n.NotificationId     == notificationId &&
                    n.RecipientAccountId == recipientAccountId);

            if (notification is null) return false;

            _db.Notifications.Remove(notification);
            await _db.SaveChangesAsync();
            return true;
        }

        /// <inheritdoc/>
        public async Task DeleteAllAsync(string recipientAccountId)
        {
            await _db.Notifications
                .Where(n => n.RecipientAccountId == recipientAccountId)
                .ExecuteDeleteAsync();
        }
    }
}
