using Android.App;
using Android.Content;
using Android.Content.PM;
using Android.OS;
using AndroidX.Core.App;

namespace AudioGo.Platforms.Android
{
    /// <summary>
    /// Foreground service chạy nền để theo dõi vị trí GPS.
    /// Notification có nút "Dừng" (như Google Maps) để tắt nhanh mà không cần mở app.
    /// </summary>
    [Service(ForegroundServiceType = ForegroundService.TypeLocation)]
    public class AndroidLocationService : Service
    {
        private const string ChannelId    = "AudioGoLocationChannel";
        private const int    NotificationId = 1001;

        // Action gửi tới service để dừng — dùng trong PendingIntent của nút notification
        public const string ActionStart = "START_SERVICE";
        public const string ActionStop  = "STOP_SERVICE";

        private bool _isStarted = false;

        public override IBinder? OnBind(Intent? intent) => null;

        public override StartCommandResult OnStartCommand(Intent? intent, StartCommandFlags flags, int startId)
        {
            if (intent?.Action == ActionStart)
            {
                if (!_isStarted)
                {
                    CreateNotificationChannel();

                    // --- PendingIntent: bấm nút "Dừng" → gửi STOP_SERVICE về service này ---
                    var stopIntent = new Intent(this, typeof(AndroidLocationService));
                    stopIntent.SetAction(ActionStop);

                    PendingIntentFlags piFlags = Build.VERSION.SdkInt >= BuildVersionCodes.M
                        ? PendingIntentFlags.Immutable
                        : 0;

                    var stopPendingIntent = PendingIntent.GetService(this, 0, stopIntent, piFlags)!;

                    // --- PendingIntent: bấm vào notification body → mở app ---
                    var openAppIntent = PackageManager?
                        .GetLaunchIntentForPackage(PackageName ?? string.Empty);
                    var openAppPending = openAppIntent != null
                        ? PendingIntent.GetActivity(this, 1, openAppIntent, piFlags)
                        : null;

                    var notification = new NotificationCompat.Builder(this, ChannelId)
                        .SetContentTitle("AudioGo đang chạy")
                        .SetContentText("Đang theo dõi vị trí để tự động phát audio khi bạn vào vùng điểm tham quan.")
                        .SetSmallIcon(global::Android.App.Application.Context.ApplicationInfo!.Icon)
                        .SetOngoing(true)
                        .SetContentIntent(openAppPending)
                        // ── Nút hành động "Dừng theo dõi" ──────────────────
                        .AddAction(
                            global::Android.Resource.Drawable.IcMediaPause,
                            "Dừng theo dõi",
                            stopPendingIntent)
                        .Build();

                    if (Build.VERSION.SdkInt >= BuildVersionCodes.Q)
                        StartForeground(NotificationId, notification, ForegroundService.TypeLocation);
                    else
                        StartForeground(NotificationId, notification);

                    _isStarted = true;
                }
            }
            else if (intent?.Action == ActionStop)
            {
                StopForeground(StopForegroundFlags.Remove);
                StopSelf();
                _isStarted = false;
            }

            return StartCommandResult.Sticky;
        }

        private void CreateNotificationChannel()
        {
            if (Build.VERSION.SdkInt >= BuildVersionCodes.O)
            {
                var channel = new NotificationChannel(
                    ChannelId,
                    "AudioGo Location Tracking",
                    NotificationImportance.Low)
                {
                    Description = "Dịch vụ định vị chạy nền để phát hiện khi bạn vào vùng POI."
                };

                var mgr = (NotificationManager?)GetSystemService(NotificationService);
                mgr?.CreateNotificationChannel(channel);
            }
        }
    }
}
