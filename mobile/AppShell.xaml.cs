using AudioGo_Mobile.Views;

namespace AudioGo_Mobile;

public partial class AppShell : Shell
{
    public AppShell()
    {
        InitializeComponent();

        // Đăng ký routes — MAUI Shell tự resolve từ DI khi page được register vào Services.
        // (Yêu cầu AddTransient<PoiDetailPage>() đã có trong MauiProgram.cs)
        Routing.RegisterRoute(nameof(PoiDetailPage),    typeof(PoiDetailPage));
        // Routing.RegisterRoute(nameof(TourDetailPage),   typeof(TourDetailPage));
        // Routing.RegisterRoute(nameof(CreateTourPage),   typeof(CreateTourPage));
    }
}
