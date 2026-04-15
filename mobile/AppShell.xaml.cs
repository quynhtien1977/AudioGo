using AudioGo.Helpers;
using AudioGo.Services;
using AudioGo_Mobile.Views;

namespace AudioGo_Mobile;

public partial class AppShell : Shell
{
    private readonly SyncService _sync;

    public AppShell(SyncService sync)
    {
        InitializeComponent();

        _sync = sync;

        // Đăng ký routes — MAUI Shell tự resolve từ DI khi page được register vào Services.
        Routing.RegisterRoute(nameof(PoiDetailPage), typeof(PoiDetailPage));

        // Subscribe to language changes to refresh tab bar labels
        _sync.LanguageChanged += OnLanguageChanged;

        // Apply initial titles on startup
        UpdateTabTitles();
    }

    private void OnLanguageChanged(object? sender, string newLang)
    {
        MainThread.BeginInvokeOnMainThread(() => UpdateTabTitles(newLang));
    }

    private void UpdateTabTitles(string? languageCode = null)
    {
        // Tab items are named in AppShell.xaml (x:Name="TabHome" etc.)
        // We update their Title properties here in code-behind.
        try
        {
            if (string.IsNullOrWhiteSpace(languageCode))
            {
                TabHome.Title     = AppStrings.Get("tab_home");
                TabSearch.Title   = AppStrings.Get("tab_search");
                TabMap.Title      = AppStrings.Get("tab_map");
                TabSettings.Title = AppStrings.Get("tab_settings");
            }
            else
            {
                TabHome.Title     = AppStrings.GetForLanguage("tab_home", languageCode);
                TabSearch.Title   = AppStrings.GetForLanguage("tab_search", languageCode);
                TabMap.Title      = AppStrings.GetForLanguage("tab_map", languageCode);
                TabSettings.Title = AppStrings.GetForLanguage("tab_settings", languageCode);
            }
        }
        catch
        {
            // Silently ignore — tab bar still functional with XAML-defined titles
        }
    }
}
