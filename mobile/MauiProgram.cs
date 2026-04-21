using AudioGo.Data;
using AudioGo.Services;
using AudioGo.Services.Interfaces;
using AudioGo.ViewModels;
using AudioGo_Mobile.ViewModels;
using AudioGo_Mobile.Views;
using Microsoft.Extensions.Logging;
using Plugin.Maui.Audio;
using BarcodeScanner.Mobile;
using CommunityToolkit.Maui;

namespace AudioGo_Mobile;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit()
            .UseMauiMaps()
            .ConfigureMauiHandlers(handlers => {
                handlers.AddBarcodeScannerHandler();
            })
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
                // Inter — Google Fonts (UI chính)
                fonts.AddFont("Inter-Regular.ttf",  "InterRegular");
                fonts.AddFont("Inter-Medium.ttf",   "InterMedium");
                fonts.AddFont("Inter-SemiBold.ttf", "InterSemiBold");
                fonts.AddFont("Inter-Bold.ttf",     "InterBold");
                // Material Icons — Google icon font
                fonts.AddFont("MaterialIcons.ttf",  "MaterialIcons");
            });

#if ANDROID
        AudioGo.Platforms.Android.CustomMapPinHandler.Register();
#endif
        // ── Database ──────────────────────────────────────────────
        var dbPath = Path.Combine(FileSystem.AppDataDirectory, "audiogo.db3");
        builder.Services.AddSingleton(new AppDatabase(dbPath));

        // ── HTTP Client ───────────────────────────────────────────
        builder.Services.AddHttpClient<IApiService, ApiService>(client =>
        {
            // 10.0.2.2 = IP đặc biệt dành cho Android Emulator kết nối về localhost của PC
            // Đổi về 192.168.x.x nếu dùng thiết bị thật trên cùng mạng WiFi
            client.BaseAddress = new Uri(DeviceInfo.DeviceType == DeviceType.Virtual 
                ? "http://10.0.2.2:5086/" 
                : "http://192.168.1.12:5086/");
            // 8s: đủ cho WiFi nội bộ, fail-fast để fallback cache kịp thời
            client.Timeout = TimeSpan.FromSeconds(8);
        });

        // Named client cho download files nền (audio/image) — không cần timeout ngắn
        builder.Services.AddHttpClient("downloader", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(60);
        });

        // ── Services ──────────────────────────────────────────────
        builder.Services.AddSingleton(AudioManager.Current);
        builder.Services.AddSingleton<SyncService>();
        builder.Services.AddSingleton<IGeofenceService, GeofenceService>();
        builder.Services.AddSingleton<IAudioService, AudioService>();
        builder.Services.AddSingleton<ILocationService, LocationService>();

        // ── ViewModels ────────────────────────────────────────────
        builder.Services.AddSingleton<MainViewModel>();
        builder.Services.AddSingleton<MapViewModel>();
        builder.Services.AddTransient<PoiDetailViewModel>();
        builder.Services.AddTransient<SettingsViewModel>();
        builder.Services.AddTransient<SearchViewModel>();
        builder.Services.AddTransient<WelcomeQrScanViewModel>();

        // ── Views ─────────────────────────────────────────────────
        // AppShell phải là Singleton để WelcomeQrScanViewModel có thể
        // resolve qua DI (tránh "new AppShell()" ngoài DI container).
        builder.Services.AddSingleton<AppShell>();
        builder.Services.AddSingleton<MainPage>();
        builder.Services.AddSingleton<MapPage>();
        builder.Services.AddTransient<PoiDetailPage>();
        builder.Services.AddTransient<SettingsPage>();
        builder.Services.AddTransient<SearchPage>();
        builder.Services.AddTransient<WelcomePage>();
        builder.Services.AddTransient<WelcomeQrScanPage>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        var mauiApp = builder.Build();

        // ── Global exception handlers ─────────────────────────────
        AppDomain.CurrentDomain.UnhandledException += (s, e) =>
        {
            System.Diagnostics.Debug.WriteLine($"[APPDOMAIN UNHANDLED] {((Exception)e.ExceptionObject)?.Message}");
        };

        // Ngăn các fire-and-forget tasks (download, refresh) crash toàn app.
        // Trên Android, một Task ném exception mà không có await → crash process.
        TaskScheduler.UnobservedTaskException += (_, e) =>
        {
            System.Diagnostics.Debug.WriteLine(
                $"[UNOBSERVED TASK] {e.Exception?.GetType().Name}: {e.Exception?.Message}");
            e.SetObserved(); // Đánh dấu đã xử lý → ngăn crash
        };

#if ANDROID
        // ✅ Chỉ log, không handle — để Android xử lý đúng cách
        Android.Runtime.AndroidEnvironment.UnhandledExceptionRaiser += (_, e) =>
        {
            System.Diagnostics.Debug.WriteLine(
                $"[ANDROID UNHANDLED] {e.Exception?.GetType().Name}: {e.Exception?.Message}");
            // Không set Handled = true
        };
#endif

        return mauiApp;
    }
}
