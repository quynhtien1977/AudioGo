using AudioGo.Data;
using AudioGo.Services;
using AudioGo.Services.Interfaces;
using AudioGo.ViewModels;
using AudioGo_Mobile.Views;
using Microsoft.Extensions.Logging;
using Plugin.Maui.Audio;
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
                // Inter — Google Fonts (UI chính)
                fonts.AddFont("Inter-Regular.ttf",  "InterRegular");
                fonts.AddFont("Inter-Medium.ttf",   "InterMedium");
                fonts.AddFont("Inter-SemiBold.ttf", "InterSemiBold");
                fonts.AddFont("Inter-Bold.ttf",     "InterBold");
                // Material Icons — Google icon font
                fonts.AddFont("MaterialIcons.ttf",  "MaterialIcons");
            });

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
                : "http://192.168.43.73:5086/");
            client.Timeout = TimeSpan.FromSeconds(15);
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
        builder.Services.AddTransient<TourListViewModel>();
        builder.Services.AddTransient<SearchViewModel>();
        builder.Services.AddTransient<TourDetailViewModel>();

        // ── Views ─────────────────────────────────────────────────
        builder.Services.AddSingleton<MainPage>();
        builder.Services.AddSingleton<MapPage>();
        builder.Services.AddTransient<TourListPage>();
        builder.Services.AddTransient<PoiDetailPage>();
        builder.Services.AddTransient<SearchPage>();
        builder.Services.AddTransient<TourDetailPage>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        var mauiApp = builder.Build();

        // Init SQLite tables trên background thread — không block main thread khi startup
        _ = Task.Run(() => mauiApp.Services.GetRequiredService<AppDatabase>().InitAsync());

        return mauiApp;
    }
}
