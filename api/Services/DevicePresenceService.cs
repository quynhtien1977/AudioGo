using System.Collections.Concurrent;
using Server.Services.Interfaces;

namespace Server.Services
{
    /// <summary>
    /// Singleton in-memory registry of currently connected devices.
    /// Thread-safe via ConcurrentDictionary — no DB writes on presence changes.
    /// Key = connectionId, Value = deviceId (non-empty string for mobile devices,
    /// empty string for web/admin connections).
    /// </summary>
    public class DevicePresenceService : IDevicePresenceService
    {
        // connectionId → deviceId  (empty = web admin, non-empty = mobile device)
        private readonly ConcurrentDictionary<string, string> _connections = new();

        public void MarkOnline(string connectionId, string deviceId)
        {
            _connections[connectionId] = deviceId;
        }

        public string? MarkOffline(string connectionId)
        {
            if (_connections.TryRemove(connectionId, out var deviceId))
                return string.IsNullOrEmpty(deviceId) ? null : deviceId;

            return null;
        }

        public IReadOnlyList<string> GetOnlineDeviceIds()
        {
            return _connections.Values
                .Where(v => !string.IsNullOrEmpty(v))
                .Distinct()
                .ToList()
                .AsReadOnly();
        }

        public int OnlineCount =>
            _connections.Values.Count(v => !string.IsNullOrEmpty(v));

        public bool IsOnline(string deviceId) =>
            _connections.Values.Any(v => v == deviceId);
    }
}
