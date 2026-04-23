namespace Server.Services.Interfaces
{
    /// <summary>
    /// Tracks which devices are currently connected via SignalR.
    /// Uses in-memory state — no DB writes on connect/disconnect.
    /// </summary>
    public interface IDevicePresenceService
    {
        /// <summary>Registers a device as online. Maps connectionId → deviceId.</summary>
        void MarkOnline(string connectionId, string deviceId);

        /// <summary>
        /// Removes a connection. Returns the deviceId that was removed,
        /// or null if the connectionId belonged to a web admin (no device).
        /// </summary>
        string? MarkOffline(string connectionId);

        /// <summary>Returns snapshot of all currently online device IDs.</summary>
        IReadOnlyList<string> GetOnlineDeviceIds();

        /// <summary>Number of devices currently online.</summary>
        int OnlineCount { get; }

        /// <summary>Returns true if the given deviceId has at least one active connection.</summary>
        bool IsOnline(string deviceId);
    }
}
