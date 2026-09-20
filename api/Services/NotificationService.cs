using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Text.Json;

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
            if (!roleList.Any()) return;

            var effectiveRoles = roleList.ToList();
            int notificationCount = 0;

            // 1. "Public" = broadcast không cần account (mobile tourists)
            if (roleList.Contains("Public"))
            {
                await CreateAsync(null, "Broadcast", title, body, createdByAccountId);
                notificationCount++;
                roleList = roleList.Where(r => r != "Public").ToList();
            }

            // 2. Fan-out: lấy tất cả AccountId có role trong danh sách còn lại
            if (roleList.Any())
            {
                var recipientIds = await _db.Accounts
                    .Where(a => roleList.Contains(a.Role) && a.DeletedAt == null)
                    .Select(a => a.AccountId)
                    .ToListAsync();

                if (recipientIds.Any())
                {
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
                    notificationCount += notifications.Count;
                }
                else
                {
                    _logger.LogWarning("BroadcastToRoles: no accounts found for roles [{Roles}]", string.Join(",", roleList));
                }
            }

            // 3. ── Lưu lịch sử campaign (1 row/đợt phát) ───────────────────────────────
            _db.BroadcastCampaigns.Add(new BroadcastCampaign
            {
                CampaignId         = Guid.NewGuid().ToString(),
                Title              = title,
                Body               = body,
                TargetRolesJson    = JsonSerializer.Serialize(effectiveRoles),
                RecipientCount     = notificationCount,
                CreatedAt          = DateTime.UtcNow,
                CreatedByAccountId = createdByAccountId
            });
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "📢 Broadcast [{Title}] → {Count} notifications created (roles: {Roles})",
                title, notificationCount, string.Join(",", effectiveRoles));
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

        // ── BROADCAST HISTORY ─────────────────────────────────────────────────

        /// <inheritdoc/>
        public async Task<List<BroadcastCampaignDto>> GetBroadcastHistoryAsync(int page = 1, int pageSize = 20)
        {
            var list = await _db.BroadcastCampaigns
                .Include(c => c.CreatedByAccount)
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();

            return list.Select(c =>
            {
                var roles = new List<string>();
                try { roles = JsonSerializer.Deserialize<List<string>>(c.TargetRolesJson) ?? []; } catch { }

                return new BroadcastCampaignDto(
                    c.CampaignId,
                    c.Title,
                    c.Body,
                    roles,
                    c.RecipientCount,
                    c.CreatedAt,
                    c.CreatedByAccountId,
                    c.CreatedByAccount?.FullName
                );
            }).ToList();
        }
    }
}
