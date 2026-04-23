using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;
using System.Security.Claims;

namespace Server.Hubs
{
    // ✅ Cho phép cả Admin (web) và GuestApp (mobile) kết nối
    [Authorize]
    public class DeviceHub : Hub
    {
        private readonly IDevicePresenceService _presence;
        private readonly AppDbContext _context;
        private readonly ILogger<DeviceHub> _logger;

        public DeviceHub(
            IDevicePresenceService presence,
            AppDbContext context,
            ILogger<DeviceHub> logger)
        {
            _presence = presence;
            _context = context;
            _logger = logger;
        }

        // ─────────────────────────────────────────────────────────────────
        // CONNECT
        // ─────────────────────────────────────────────────────────────────
        public override async Task OnConnectedAsync()
        {
            // DeviceId lấy từ claim sub/nameidentifier — do JWT mobile set khi QR login
            // Web admin sẽ không có claim này → deviceId rỗng
            var deviceId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? Context.User?.FindFirst("sub")?.Value
                        ?? "";

            var connectionId = Context.ConnectionId;

            if (string.IsNullOrWhiteSpace(deviceId))
            {
                // ── Web admin connection ──────────────────────────────────
                _presence.MarkOnline(connectionId, ""); // web = empty deviceId
                await Groups.AddToGroupAsync(connectionId, "admin_dashboard");
                _logger.LogInformation("🖥️  Web admin joined admin_dashboard: {ConnId}", connectionId);
            }
            else
            {
                // ── Mobile device connection ──────────────────────────────
                _presence.MarkOnline(connectionId, deviceId);

                var allOnline = _presence.GetOnlineDeviceIds();

                // Gửi sự kiện DeviceOnline tới admin dashboard (không broadcast all)
                await Clients.Group("admin_dashboard").SendAsync("DeviceOnline", new
                {
                    deviceId,
                    isActive  = true,
                    lastSeen  = DateTime.UtcNow,
                    onlineNow = allOnline.Count
                });

                _logger.LogInformation("📱 Device connected: {DeviceId} | Online now: {Count}",
                    deviceId, allOnline.Count);
            }

            await base.OnConnectedAsync();
        }

        // ─────────────────────────────────────────────────────────────────
        // DISCONNECT
        // ─────────────────────────────────────────────────────────────────
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var connectionId = Context.ConnectionId;

            // MarkOffline trả về deviceId nếu là mobile, null nếu là web
            var deviceId = _presence.MarkOffline(connectionId);

            if (deviceId is not null)
            {
                var allOnline = _presence.GetOnlineDeviceIds();

                await Clients.Group("admin_dashboard").SendAsync("DeviceOffline", new
                {
                    deviceId,
                    isActive  = false,
                    lastSeen  = DateTime.UtcNow,
                    onlineNow = allOnline.Count
                });

                _logger.LogInformation("📴 Device disconnected: {DeviceId} | Online now: {Count}",
                    deviceId, allOnline.Count);
            }
            else
            {
                _logger.LogInformation("🖥️  Web admin disconnected: {ConnId}", connectionId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        // ─────────────────────────────────────────────────────────────────
        // MOBILE → SERVER: gửi vị trí GPS thực, lưu LocationLog
        // ─────────────────────────────────────────────────────────────────
        public async Task SendLocationUpdate(double latitude, double longitude)
        {
            var deviceId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? Context.User?.FindFirst("sub")?.Value
                        ?? "";

            if (string.IsNullOrWhiteSpace(deviceId))
            {
                _logger.LogWarning("⚠️  SendLocationUpdate rejected: no deviceId in JWT");
                return;
            }

            try
            {
                // ✅ Chỉ lưu DB khi có tọa độ thực — không ghi 0,0
                var locationLog = new LocationLog
                {
                    LocationId = $"{deviceId}_{Guid.NewGuid():N}",
                    DeviceId   = deviceId,
                    Latitude   = latitude,
                    Longitude  = longitude,
                    Timestamp  = DateTime.UtcNow
                };

                _context.LocationLogs.Add(locationLog);
                await _context.SaveChangesAsync();

                // Broadcast tới admin dashboard (không phải Clients.All)
                await Clients.Group("admin_dashboard").SendAsync("LocationUpdated", new
                {
                    deviceId,
                    latitude,
                    longitude,
                    timestamp = locationLog.Timestamp
                });

                _logger.LogInformation("📍 Location from {DeviceId}: ({Lat}, {Lon})",
                    deviceId, latitude, longitude);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error saving location for {DeviceId}", deviceId);
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // WEB → SERVER: lấy snapshot danh sách đang online (call 1 lần khi mount)
        // ─────────────────────────────────────────────────────────────────
        public Task<object> GetActiveDevices()
        {
            var onlineIds = _presence.GetOnlineDeviceIds();

            return Task.FromResult<object>(new
            {
                onlineNow   = onlineIds.Count,
                deviceIds   = onlineIds,
                snapshotAt  = DateTime.UtcNow
            });
        }
    }
}
