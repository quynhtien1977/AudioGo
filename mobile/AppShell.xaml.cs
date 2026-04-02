using AudioGo_Mobile.Views;

namespace AudioGo_Mobile;

public partial class AppShell : Shell
{
    public AppShell()
    {
        InitializeComponent();

        // Routes cho navigation (không có tab — navigate bằng GoToAsync)
        Routing.RegisterRoute(nameof(PoiDetailPage),    typeof(PoiDetailPage));
        Routing.RegisterRoute(nameof(TourDetailPage),   typeof(TourDetailPage));
        Routing.RegisterRoute(nameof(CreateTourPage),   typeof(CreateTourPage));
    }
}
