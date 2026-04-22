using Microsoft.AspNetCore.SignalR;
using Server.Data;
using Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Server.Hubs
{
    public class DeviceHub : Hub
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DeviceHub> _logger;

        public DeviceHub(AppDbContext context, ILogger<DeviceHub> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ✅ WHEN DEVICE CONNECTS (Mobile app connects to hub)
        public override async Task OnConnectedAsync()
        {
            // Lấy deviceId từ query string
            var deviceId = Context.GetHttpContext()?.Request.Query["deviceId"].ToString()
                        ?? Context.User?.FindFirst("deviceId")?.Value
                        ?? "";

            // ❌ SKIP WEB CONNECTIONS - Chỉ nhận mobile devices có deviceId hợp lệ
            if (string.IsNullOrWhiteSpace(deviceId))
            {
                _logger.LogInformation($"⏭️ WEB CONNECTION SKIPPED: {Context.ConnectionId}");
                await base.OnConnectedAsync();
                return;
            }

            _logger.LogInformation($"✅ Mobile Device Connected: {deviceId}");

            try
            {
                // 📍 CREATE NEW LOCATION LOG ENTRY - Device Online
                var locationLog = new LocationLog
                {
                    LocationId = $"{deviceId}_{Guid.NewGuid()}_{DateTime.UtcNow.Ticks}",
                    DeviceId = deviceId,
                    Latitude = 0,
                    Longitude = 0,
                    Timestamp = DateTime.UtcNow
                };

                _context.LocationLogs.Add(locationLog);
                await _context.SaveChangesAsync();

                // 📢 BROADCAST: Device Online → All web clients
                await Clients.All.SendAsync("DeviceOnline", new
                {
                    deviceId = deviceId,
                    isActive = true,
                    lastSeen = DateTime.UtcNow,
                    latitude = 0,
                    longitude = 0,
                    timestamp = DateTime.UtcNow
                });

                _logger.LogInformation($"✅ Device {deviceId} is now ONLINE");
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error in OnConnectedAsync: {ex.Message}");
            }

            await base.OnConnectedAsync();
        }

        // ✅ WHEN DEVICE DISCONNECTS (Mobile app closes or loses connection)
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Lấy deviceId từ query string
            var deviceId = Context.GetHttpContext()?.Request.Query["deviceId"].ToString()
                        ?? Context.User?.FindFirst("deviceId")?.Value
                        ?? "";

            // ❌ SKIP WEB CONNECTIONS
            if (string.IsNullOrWhiteSpace(deviceId))
            {
                _logger.LogInformation($"⏭️ WEB DISCONNECTION SKIPPED: {Context.ConnectionId}");
                await base.OnDisconnectedAsync(exception);
                return;
            }

            _logger.LogInformation($"❌ Mobile Device Disconnected: {deviceId}");

            try
            {
                // 🔍 FIND LAST ACTIVE LOCATION LOG FOR THIS DEVICE
                var lastLocationLog = await _context.LocationLogs
                    .Where(l => l.DeviceId == deviceId)
                    .OrderByDescending(l => l.Timestamp)
                    .FirstOrDefaultAsync();

                // 📢 BROADCAST: Device Offline → All web clients
                await Clients.All.SendAsync("DeviceOffline", new
                {
                    deviceId = deviceId,
                    isActive = false,
                    lastSeen = DateTime.UtcNow,
                    latitude = lastLocationLog?.Latitude ?? 0,
                    longitude = lastLocationLog?.Longitude ?? 0,
                    timestamp = DateTime.UtcNow
                });

                _logger.LogInformation($"❌ Device {deviceId} is now OFFLINE");
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error in OnDisconnectedAsync: {ex.Message}");
            }

            await base.OnDisconnectedAsync(exception);
        }

        // ✅ MOBILE SENDS LOCATION UPDATE
        public async Task SendLocationUpdate(string deviceId, double latitude, double longitude)
        {
            // ❌ SKIP IF NO VALID DEVICE ID
            if (string.IsNullOrWhiteSpace(deviceId))
            {
                _logger.LogWarning($"⏭️ Location update rejected: Empty deviceId");
                return;
            }

            try
            {
                var locationLog = new LocationLog
                {
                    LocationId = $"{deviceId}_{Guid.NewGuid()}_{DateTime.UtcNow.Ticks}",
                    DeviceId = deviceId,
                    Latitude = latitude,
                    Longitude = longitude,
                    Timestamp = DateTime.UtcNow
                };

                _context.LocationLogs.Add(locationLog);
                await _context.SaveChangesAsync();

                // 📢 BROADCAST LOCATION UPDATE → All web clients
                await Clients.All.SendAsync("LocationUpdated", new
                {
                    deviceId = deviceId,
                    latitude = latitude,
                    longitude = longitude,
                    timestamp = DateTime.UtcNow
                });

                _logger.LogInformation($"📍 Location update from {deviceId}: ({latitude}, {longitude})");
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error in SendLocationUpdate: {ex.Message}");
            }
        }

        // ✅ GET ALL ACTIVE DEVICES (Web request)
        public async Task<IEnumerable<object>> GetActiveDevices()
        {
            try
            {
                // Get latest location for each device
                var devices = await _context.LocationLogs
                    .GroupBy(l => l.DeviceId)
                    .Select(g => g.OrderByDescending(l => l.Timestamp).First())
                    .Select(l => new
                    {
                        l.DeviceId,
                        l.Latitude,
                        l.Longitude,
                        l.Timestamp,
                        isActive = (DateTime.UtcNow - l.Timestamp).TotalMinutes <= 5
                    })
                    .ToListAsync();

                return devices;
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error in GetActiveDevices: {ex.Message}");
                return Enumerable.Empty<object>();
            }
        }
    }
}
