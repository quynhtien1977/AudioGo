using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Server.Models;
using Server.Queues;
using Server.Services.Interfaces;
using System.Security.Claims;

namespace Server.Hubs
{
    // ✅ Cho phép cả Admin (web) và GuestApp (mobile) kết nối
    [Authorize]
    public class DeviceHub : Hub
    {
        private readonly IDevicePresenceService _presence;
        private readonly ILocationQueue _locationQueue;
        private readonly ILogger<DeviceHub> _logger;

        public DeviceHub(
            IDevicePresenceService presence,
            ILocationQueue locationQueue,
            ILogger<DeviceHub> logger)
        {
            _presence = presence;
            _locationQueue = locationQueue;
            _logger = logger;
        }

        // ─────────────────────────────────────────────────────────────────
        // CONNECT
        // ─────────────────────────────────────────────────────────────────
        public override async Task OnConnectedAsync()
        {
            var connectionId = Context.ConnectionId;

            // ✅ Phân biệt Web Admin vs Mobile Device bằng ROLE claim
            // — Web admin JWT: Role = "Admin" hoặc "Manager", NameIdentifier = AccountId (GUID)
            // — Mobile JWT: Role = "GuestApp" (hoặc không có), NameIdentifier = DeviceId
            // Trước đây dùng NameIdentifier rỗng để phân biệt, nhưng web admin cũng có
            // NameIdentifier = AccountId → bị nhầm là mobile device!
            var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value ?? "";
            var isWebAdmin = role is "Admin" or "Manager";

            if (isWebAdmin)
            {
                // ── Web admin connection ──────────────────────────────────
                _presence.MarkOnline(connectionId, ""); // web = empty deviceId
                await Groups.AddToGroupAsync(connectionId, "admin_dashboard");
                _logger.LogInformation("🖥️  Web admin joined admin_dashboard: {ConnId} | Role: {Role}",
                    connectionId, role);
            }
            else
            {
                // ── Mobile device connection ──────────────────────────────
                var deviceId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                            ?? Context.User?.FindFirst("sub")?.Value
                            ?? "";

                if (string.IsNullOrWhiteSpace(deviceId))
                {
                    _logger.LogWarning("⚠️  Unknown connection (no deviceId, no admin role): {ConnId}", connectionId);
                    Context.Abort();
                    return;
                }

                _presence.MarkOnline(connectionId, deviceId);

                await Clients.Group("admin_dashboard").SendAsync("DeviceOnline", new
                {
                    deviceId,
                    isActive  = true,
                    lastSeen  = DateTime.UtcNow,
                    onlineNow = _presence.OnlineCount
                });

                _logger.LogInformation("📱 Device connected: {DeviceId} | Online now: {Count}",
                    deviceId, _presence.OnlineCount);
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
                // ✅ Chỉ gửi sự kiện Offline nếu KHÔNG còn connection nào khác của thiết bị này
                if (!_presence.IsOnline(deviceId))
                {
                    await Clients.Group("admin_dashboard").SendAsync("DeviceOffline", new
                    {
                        deviceId,
                        isActive  = false,
                        lastSeen  = DateTime.UtcNow,
                        onlineNow = _presence.OnlineCount
                    });

                    _logger.LogInformation("📴 Device disconnected: {DeviceId} | Online now: {Count}",
                        deviceId, _presence.OnlineCount);
                }
                else
                {
                    _logger.LogInformation("📴 Device connection dropped but device still online via another connection: {DeviceId}", deviceId);
                }
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

                // ✅ Gửi vào Queue thay vì lưu DB trực tiếp
                await _locationQueue.QueueLocationAsync(locationLog);

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
                onlineNow   = _presence.OnlineCount,
                deviceIds   = onlineIds,
                snapshotAt  = DateTime.UtcNow
            });
        }
    }
}
