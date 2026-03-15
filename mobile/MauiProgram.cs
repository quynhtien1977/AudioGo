using AudioGo.Data;
using AudioGo.Services;
using AudioGo.Services.Interfaces;
using AudioGo.ViewModels;
using AudioGo_Mobile.Views;
using Microsoft.Extensions.Logging;
using ZXing.Net.Maui.Controls;

namespace AudioGo_Mobile;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseMauiMaps()
            .UseBarcodeReader()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // ── Database ──────────────────────────────────────────────
        var dbPath = Path.Combine(FileSystem.AppDataDirectory, "audiogo.db3");
        builder.Services.AddSingleton(new AppDatabase(dbPath));

        // ── HTTP Client ───────────────────────────────────────────
        builder.Services.AddHttpClient<IApiService, ApiService>(client =>
        {
            // Thay bằng URL thật khi deploy; dùng IP máy dev khi test trên Android
            client.BaseAddress = new Uri("http://10.0.2.2:5000/"); // Android emulator → localhost
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        // ── Services ──────────────────────────────────────────────
        builder.Services.AddSingleton<SyncService>();
        builder.Services.AddSingleton<IGeofenceService, GeofenceService>();
        builder.Services.AddSingleton<IAudioService, AudioService>();
        builder.Services.AddSingleton<ILocationService, LocationService>();

        // ── ViewModels ────────────────────────────────────────────
        builder.Services.AddSingleton<MainViewModel>();
        builder.Services.AddSingleton<MapViewModel>();
        builder.Services.AddTransient<PoiDetailViewModel>();

        // ── Views ─────────────────────────────────────────────────
        builder.Services.AddSingleton<MainPage>();
        builder.Services.AddSingleton<MapPage>();
        builder.Services.AddTransient<PoiDetailPage>();
        builder.Services.AddTransient<QrScanPage>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        var mauiApp = builder.Build();

        // Init SQLite tables trên thread pool — tránh deadlock SynchronizationContext
        // Task.Run() đảm bảo chạy trên thread không có SynchronizationContext
        Task.Run(() => mauiApp.Services.GetRequiredService<AppDatabase>().InitAsync())
            .GetAwaiter().GetResult();

        return mauiApp;
    }
}
