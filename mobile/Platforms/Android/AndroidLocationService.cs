using Android.App;
using Android.Content;
using Android.Content.PM;
using Android.OS;
using AndroidX.Core.App;

namespace AudioGo.Platforms.Android
{
    [Service(ForegroundServiceType = ForegroundService.TypeLocation)]
    public class AndroidLocationService : Service
    {
        private const string ChannelId = "AudioGoLocationChannel";
        private const int NotificationId = 1001;
        private bool _isStarted = false;

        public override IBinder? OnBind(Intent? intent)
        {
            return null; // Không bind, chỉ chạy nền
        }

        public override StartCommandResult OnStartCommand(Intent? intent, StartCommandFlags flags, int startId)
        {
            if (intent?.Action == "START_SERVICE")
            {
                if (!_isStarted)
                {
                    CreateNotificationChannel();
                    
                    var notification = new NotificationCompat.Builder(this, ChannelId)
                        .SetContentTitle("AudioGo")
                        .SetContentText("Đang theo dõi vị trí ở chế độ nền để tự động phát âm thanh.")
                        .SetSmallIcon(global::Android.App.Application.Context.ApplicationInfo!.Icon) 
                        .SetOngoing(true)
                        .Build();

                    if (Build.VERSION.SdkInt >= BuildVersionCodes.Q) // Android 10+
                    {
                        StartForeground(NotificationId, notification, ForegroundService.TypeLocation);
                    }
                    else
                    {
                        StartForeground(NotificationId, notification);
                    }
                    _isStarted = true;
                }
            }
            else if (intent?.Action == "STOP_SERVICE")
            {
                StopForeground(StopForegroundFlags.Remove);
                StopSelf();
                _isStarted = false;
            }

            return StartCommandResult.Sticky;
        }

        private void CreateNotificationChannel()
        {
            if (Build.VERSION.SdkInt >= BuildVersionCodes.O) // Android 8.0+
            {
                var name = "AudioGo Location Tracking";
                var description = "Dịch vụ định vị chạy nền để phát hiện khi bạn vào vùng POI.";
                var channel = new NotificationChannel(ChannelId, name, NotificationImportance.Low)
                {
                    Description = description
                };

                var notificationManager = (NotificationManager?)GetSystemService(NotificationService);
                notificationManager?.CreateNotificationChannel(channel);
            }
        }
    }
}
