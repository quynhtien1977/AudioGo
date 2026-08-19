using AudioGo.Services.Interfaces;
using AudioGo_Mobile.Config;
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
            EndpointConfig.GetHubUrl(DeviceInfo.DeviceType);

        // ── State ──────────────────────────────────────────────────────────
        public bool IsConnected =>
            _connection?.State == HubConnectionState.Connected;

        // Guard: ngăn gọi StartAsync song song
        private SemaphoreSlim _startLock = new(1, 1);

        // Theo dõi xem đã hook sự kiện ConnectivityChanged chưa
        private bool _isListeningConnectivity;

        // ── Start ──────────────────────────────────────────────────────────
        public async Task StartAsync(CancellationToken ct = default)
        {
            if (!_isListeningConnectivity)
            {
                Connectivity.ConnectivityChanged += OnConnectivityChanged;
                _isListeningConnectivity = true;
            }

            await _startLock.WaitAsync(ct);
            try
            {
                // Đã kết nối hoặc đang kết nối → skip
                if (_connection?.State is HubConnectionState.Connected
                                       or HubConnectionState.Connecting
                                       or HubConnectionState.Reconnecting)
                    return;

                // Dispose connection cũ trước khi build mới nếu đã bị đóng (ngăn leak memory)
                if (_connection != null)
                {
                    await _connection.DisposeAsync();
                    _connection = null;
                }

                // Lấy JWT từ SecureStorage (set sau QR scan)
                var token = await SecureStorage.GetAsync("GuestToken");
                if (string.IsNullOrEmpty(token))
                {
                    #if DEBUG
                    System.Diagnostics.Debug.WriteLine("[SignalR] ⚠️  No JWT found — skip connect");
                    #endif
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
                    #if DEBUG
                    System.Diagnostics.Debug.WriteLine($"[SignalR] 🔄 Reconnecting: {ex?.Message}");
                    #endif
                    return Task.CompletedTask;
                };
                _connection.Reconnected += connId =>
                {
                    #if DEBUG
                    System.Diagnostics.Debug.WriteLine($"[SignalR] ✅ Reconnected: {connId}");
                    #endif
                    return Task.CompletedTask;
                };
                _connection.Closed += ex =>
                {
                    #if DEBUG
                    System.Diagnostics.Debug.WriteLine($"[SignalR] ❌ Connection closed: {ex?.Message}");
                    #endif
                    return Task.CompletedTask;
                };

                await _connection.StartAsync(ct);
                #if DEBUG
                System.Diagnostics.Debug.WriteLine("[SignalR] 🟢 Connected to DeviceHub");
                #endif
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException?.Message ?? "(no inner)";
                #if DEBUG
                System.Diagnostics.Debug.WriteLine(
                    $"[SignalR] ❌ StartAsync error: {ex.Message} | Inner: {innerMsg} | URL: {HubUrl}");
                #endif
                // Không throw — location tracking vẫn hoạt động offline
            }
            finally
            {
                _startLock.Release();
            }
        }

        private void OnConnectivityChanged(object? sender, ConnectivityChangedEventArgs e)
        {
            if (e.NetworkAccess == NetworkAccess.Internet && !IsConnected)
            {
                #if DEBUG
                System.Diagnostics.Debug.WriteLine("[SignalR] 🌐 Network restored, attempting to restart connection...");
                #endif
                try
                {
                    // Chạy ngầm StartAsync
                    _ = StartAsync();
                }
                catch { }
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
                #if DEBUG
                System.Diagnostics.Debug.WriteLine($"[SignalR] ⚠️  SendLocation error: {ex.Message}");
                #endif
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
                #if DEBUG
                System.Diagnostics.Debug.WriteLine("[SignalR] 🔴 Disconnected");
                #endif
            }
            catch (Exception ex)
            {
                #if DEBUG
                System.Diagnostics.Debug.WriteLine($"[SignalR] StopAsync error: {ex.Message}");
                #endif
            }
        }

        public async ValueTask DisposeAsync()
        {
            if (_isListeningConnectivity)
            {
                Connectivity.ConnectivityChanged -= OnConnectivityChanged;
                _isListeningConnectivity = false;
            }
            await StopAsync();
            _startLock.Dispose();
        }
    }
}
