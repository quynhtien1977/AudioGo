using AudioGo.Services.Interfaces;

namespace AudioGo.Services
{
    /// <summary>
    /// Polling GPS foreground. Khi có vị trí mới, bắn event LocationUpdated.
    /// Background location cần Native service riêng (Sprint 5).
    /// </summary>
    public class LocationService : ILocationService
    {
        private readonly TimeSpan _interval = TimeSpan.FromSeconds(3);
        private CancellationTokenSource? _cts;

        public event EventHandler<(double Lat, double Lon)>? LocationUpdated;
        public bool IsRunning { get; private set; }

        public async Task StartAsync()
        {
            if (IsRunning) return;

            var status = await Permissions.RequestAsync<Permissions.LocationWhenInUse>();
            if (status != PermissionStatus.Granted) return;

            IsRunning = true;
            _cts = new CancellationTokenSource();
            _ = LoopAsync(_cts.Token);
        }

        public Task StopAsync()
        {
            _cts?.Cancel();
            IsRunning = false;
            return Task.CompletedTask;
        }

        private async Task LoopAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                try
                {
                    var loc = await Geolocation.Default.GetLocationAsync(
                        new GeolocationRequest(GeolocationAccuracy.Medium, TimeSpan.FromSeconds(2)), ct);

                    if (loc is not null)
                        LocationUpdated?.Invoke(this, (loc.Latitude, loc.Longitude));
                }
                catch (FeatureNotSupportedException) { break; }
                catch (PermissionException) { break; }
                catch { /* GPS timeout, bỏ qua */ }

                await Task.Delay(_interval, ct).ConfigureAwait(false);
            }
            IsRunning = false;
        }
    }
}
