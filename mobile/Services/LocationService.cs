using AudioGo.Services.Interfaces;

namespace AudioGo.Services
{
    /// <summary>
    /// Polling GPS foreground. Khi có vị trí mới, bắn event LocationUpdated.
    /// Background location cần Native service riêng (Sprint 5).
    /// </summary>
    public class LocationService : ILocationService
    {
        private readonly TimeSpan _interval = TimeSpan.FromSeconds(8);
        private const double MinMoveMeters = 5.0; // chỉ fire event khi di chuyển >= 5m
        private (double Lat, double Lon)? _lastFiredLocation;
        private CancellationTokenSource? _cts;

        public event EventHandler<(double Lat, double Lon)>? LocationUpdated;
        public (double Lat, double Lon)? LastKnownLocation { get; private set; }
        public bool IsRunning { get; private set; }

        public async Task StartAsync()
        {
            if (IsRunning) return;

            var status = await Permissions.RequestAsync<Permissions.LocationWhenInUse>();
            if (status != PermissionStatus.Granted) return;

            // Yêu cầu quyền hiển thị Notification cho Foreground Service (Android 13+)
            // Thiếu quyền này, Service chạy nền sẽ bị ẩn Notification và bị hệ điều hành "kill" khi thiếu RAM.
#if ANDROID
            if (OperatingSystem.IsAndroidVersionAtLeast(33))
            {
                var notifStatus = await Permissions.CheckStatusAsync<Permissions.PostNotifications>();
                if (notifStatus != PermissionStatus.Granted)
                {
                    await Permissions.RequestAsync<Permissions.PostNotifications>();
                }
            }
#endif

            IsRunning = true;
            _cts = new CancellationTokenSource();
            
#if ANDROID
            var intent = new Android.Content.Intent(Android.App.Application.Context, typeof(AudioGo.Platforms.Android.AndroidLocationService));
            intent.SetAction("START_SERVICE");
            Android.App.Application.Context.StartForegroundService(intent);
#endif

            _ = LoopAsync(_cts.Token);
        }

        public Task StopAsync()
        {
            _cts?.Cancel();
            IsRunning = false;

#if ANDROID
            var intent = new Android.Content.Intent(Android.App.Application.Context, typeof(AudioGo.Platforms.Android.AndroidLocationService));
            intent.SetAction("STOP_SERVICE");
            Android.App.Application.Context.StartService(intent);
#endif

            return Task.CompletedTask;
        }

        public async Task<(double Lat, double Lon)?> GetCurrentLocationAsync()
        {
            if (LastKnownLocation.HasValue) return LastKnownLocation.Value;
            try
            {
                var loc = await Geolocation.Default.GetLocationAsync(
                    new GeolocationRequest(GeolocationAccuracy.Medium, TimeSpan.FromSeconds(3)));
                if (loc is not null)
                {
                    LastKnownLocation = (loc.Latitude, loc.Longitude);
                    return LastKnownLocation;
                }
            }
            catch { /* Fallback */ }
            return null;
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
                    {
                        var current = (loc.Latitude, loc.Longitude);
                        // Chỉ fire event khi vị trí thay đổi đáng kể (>= 5m)
                        bool shouldFire = _lastFiredLocation is null ||
                            AudioGo.Helpers.GeoHelper.HaversineMeters(
                                _lastFiredLocation.Value.Lat, _lastFiredLocation.Value.Lon,
                                loc.Latitude, loc.Longitude) >= MinMoveMeters;

                        LastKnownLocation = current;
                        if (shouldFire)
                        {
                            _lastFiredLocation = current;
                            LocationUpdated?.Invoke(this, current);
                        }
                    }
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
