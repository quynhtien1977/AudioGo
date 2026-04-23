using AudioGo.Services.Interfaces;
using Microsoft.AspNetCore.SignalR.Client;

namespace AudioGo.Services
{
    /// <summary>
    /// Kết nối tới DeviceHub trên server qua SignalR WebSocket.
    /// JWT lấy từ SecureStorage["GuestToken"] — được set sau khi scan QR thành công.
    /// DeviceId lấy từ SecureStorage["AppDeviceId"] — khớp với claim trong JWT.
    ///
    /// Lifecycle:
    ///   StartAsync()  → gọi trong MainViewModel.InitAsync() sau QR login
    ///   SendLocationAsync() → gọi từ LocationService.LocationUpdated event
    ///   StopAsync()   → gọi khi app background hoặc logout
    /// </summary>
    public class SignalRService : ISignalRService, IAsyncDisposable
    {
        private HubConnection? _connection;

        // URL hub — đồng bộ với MauiProgram HttpClient base address
        private static string HubUrl =>
            DeviceInfo.DeviceType == DeviceType.Virtual
                ? "http://10.0.2.2:5086/deviceHub"
                : "http://192.168.1.12:5086/deviceHub";

        // ── State ──────────────────────────────────────────────────────────
        public bool IsConnected =>
            _connection?.State == HubConnectionState.Connected;

        // Guard: ngăn gọi StartAsync song song
        private SemaphoreSlim _startLock = new(1, 1);

        // ── Start ──────────────────────────────────────────────────────────
        public async Task StartAsync(CancellationToken ct = default)
        {
            await _startLock.WaitAsync(ct);
            try
            {
                // Đã kết nối hoặc đang kết nối → skip
                if (_connection?.State is HubConnectionState.Connected
                                       or HubConnectionState.Connecting
                                       or HubConnectionState.Reconnecting)
                    return;

                // Lấy JWT từ SecureStorage (set sau QR scan)
                var token = await SecureStorage.GetAsync("GuestToken");
                if (string.IsNullOrEmpty(token))
                {
                    System.Diagnostics.Debug.WriteLine("[SignalR] ⚠️  No JWT found — skip connect");
                    return;
                }

                // Build connection — truyền JWT qua query string (WebSocket không hỗ trợ header)
                _connection = new HubConnectionBuilder()
                    .WithUrl($"{HubUrl}?access_token={Uri.EscapeDataString(token)}")
                    .WithAutomaticReconnect(new[] { TimeSpan.Zero, TimeSpan.FromSeconds(3), TimeSpan.FromSeconds(10) })
                    .Build();

                // Log reconnect lifecycle
                _connection.Reconnecting  += ex =>
                {
                    System.Diagnostics.Debug.WriteLine($"[SignalR] 🔄 Reconnecting: {ex?.Message}");
                    return Task.CompletedTask;
                };
                _connection.Reconnected += connId =>
                {
                    System.Diagnostics.Debug.WriteLine($"[SignalR] ✅ Reconnected: {connId}");
                    return Task.CompletedTask;
                };
                _connection.Closed += ex =>
                {
                    System.Diagnostics.Debug.WriteLine($"[SignalR] ❌ Connection closed: {ex?.Message}");
                    return Task.CompletedTask;
                };

                await _connection.StartAsync(ct);
                System.Diagnostics.Debug.WriteLine("[SignalR] 🟢 Connected to DeviceHub");
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException?.Message ?? "(no inner)";
                System.Diagnostics.Debug.WriteLine(
                    $"[SignalR] ❌ StartAsync error: {ex.Message} | Inner: {innerMsg} | URL: {HubUrl}");
                // Không throw — location tracking vẫn hoạt động offline
            }
            finally
            {
                _startLock.Release();
            }
        }

        // ── Send Location ──────────────────────────────────────────────────
        /// <summary>
        /// Gọi HubMethod "SendLocationUpdate" trên server.
        /// Nếu chưa kết nối (network drop), bỏ qua — không throw.
        /// </summary>
        public async Task SendLocationAsync(double latitude, double longitude)
        {
            if (_connection?.State != HubConnectionState.Connected) return;

            try
            {
                await _connection.InvokeAsync("SendLocationUpdate", latitude, longitude);
            }
            catch (Exception ex)
            {
                // Network hiccup — không crash app
                System.Diagnostics.Debug.WriteLine($"[SignalR] ⚠️  SendLocation error: {ex.Message}");
            }
        }

        // ── Stop ───────────────────────────────────────────────────────────
        public async Task StopAsync()
        {
            if (_connection is null) return;

            try
            {
                await _connection.StopAsync();
                await _connection.DisposeAsync();
                _connection = null;
                System.Diagnostics.Debug.WriteLine("[SignalR] 🔴 Disconnected");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[SignalR] StopAsync error: {ex.Message}");
            }
        }

        public async ValueTask DisposeAsync()
        {
            await StopAsync();
            _startLock.Dispose();
        }
    }
}
