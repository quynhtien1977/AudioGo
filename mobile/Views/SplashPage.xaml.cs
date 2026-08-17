using AudioGo.Helpers;
using AudioGo_Mobile.Views;

namespace AudioGo_Mobile.Views;

public partial class SplashPage : ContentPage
{
    private const string SessionValidKey = "SessionValid";

    public SplashPage()
    {
        InitializeComponent();
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await RunSplashSequenceAsync();
    }

    // ── Animated entrance sequence ──────────────────────────────────────────
    private async Task RunSplashSequenceAsync()
    {
        // Kick off session check in parallel while animating
        var sessionTask = CheckSessionAsync();

        // ── Phase 1: Rings fade in (staggered) ────────────────────────────
        var ring1In = Ring1.FadeTo(1, 200);
        await Task.Delay(80);
        var ring2In = Ring2.FadeTo(1, 200);
        await Task.Delay(80);
        var ring3In = Ring3.FadeTo(1, 200);
        await Task.Delay(80);
        await Ring4.FadeTo(1, 200);

        await Task.WhenAll(ring1In, ring2In, ring3In);

        // ── Phase 2: Headphone icon slides in ─────────────────────────────
        HeadphoneIcon.Opacity = 0;
        HeadphoneIcon.TranslationY = 10;
        await Task.WhenAll(
            HeadphoneIcon.FadeTo(1, 300, Easing.CubicOut),
            HeadphoneIcon.TranslateTo(0, 0, 300, Easing.CubicOut)
        );

        // ── Phase 3: Wordmark slides up ────────────────────────────────────
        await Task.Delay(50);
        await Task.WhenAll(
            Wordmark.FadeTo(1, 350, Easing.CubicOut),
            Wordmark.TranslateTo(0, 0, 350, Easing.CubicOut)
        );

        // ── Phase 4: Accent line expands + tagline fades in ───────────────
        await Task.Delay(30);
        var tagFade = Tagline.FadeTo(0.7, 300);
        await AccentLine.SizeTo(60, 3, 400, Easing.CubicOut);
        await tagFade;

        // ── Phase 5: Progress bar appears and fills ────────────────────────
        await Task.WhenAll(
            LoadingLabel.FadeTo(1, 200),
            LoadingBar.FadeTo(1, 200)
        );
        var progressTask = LoadingBar.ProgressTo(0.85, 1200, Easing.CubicOut);

        // ── Wait for session check (minimum 300ms splash visible) ──────────
        await Task.WhenAll(
            sessionTask,
            Task.Delay(300)
        );

        // Complete the bar
        await LoadingBar.ProgressTo(1, 200, Easing.Linear);
        await Task.Delay(100);

        // ── Transition out ─────────────────────────────────────────────────
        await this.FadeTo(0, 250, Easing.CubicIn);

        // Navigate to correct destination
        var destination = await sessionTask;
        if (Application.Current is not null)
            Application.Current.MainPage = destination;
    }

    // ── Session check (mirrors App.xaml.cs logic) ──────────────────────────
    private async Task<Page> CheckSessionAsync()
    {
        var services = IPlatformApplication.Current!.Services;
        bool hasSession = Preferences.Default.Get(SessionValidKey, false);

        if (!hasSession)
            return new NavigationPage(services.GetRequiredService<WelcomePage>());

        try
        {
            var token = await SecureStorage.GetAsync("GuestToken");
            if (!string.IsNullOrEmpty(token) && IsJwtValid(token))
                return services.GetRequiredService<AppShell>();

            // Token expired
            Preferences.Default.Remove(SessionValidKey);
            SecureStorage.Remove("GuestToken");
            return new NavigationPage(services.GetRequiredService<WelcomePage>());
        }
        catch
        {
            Preferences.Default.Remove(SessionValidKey);
            return new NavigationPage(services.GetRequiredService<WelcomePage>());
        }
    }

    // ── JWT expiry check (same logic as App.xaml.cs) ───────────────────────
    private static bool IsJwtValid(string token)
    {
        try
        {
            var parts = token.Split('.');
            if (parts.Length != 3) return false;

            var payload = parts[1].Replace('-', '+').Replace('_', '/');
            switch (payload.Length % 4)
            {
                case 2: payload += "=="; break;
                case 3: payload += "=";  break;
            }

            var json = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(payload));
            using var doc = System.Text.Json.JsonDocument.Parse(json);

            if (doc.RootElement.TryGetProperty("exp", out var expProp))
                return DateTimeOffset.FromUnixTimeSeconds(expProp.GetInt64()).UtcDateTime > DateTime.UtcNow;
        }
        catch { /* ignore */ }
        return false;
    }
}

// ── Extension: animate WidthRequest (for accent line expand) ───────────────
internal static class ViewExtensions
{
    public static Task SizeTo(this BoxView view, double toWidth, double toHeight, uint duration, Easing? easing = null)
    {
        var tcs = new TaskCompletionSource<bool>();
        var startWidth = view.WidthRequest;
        var startHeight = view.HeightRequest;
        var anim = new Animation(t =>
        {
            view.WidthRequest  = startWidth  + (toWidth  - startWidth)  * t;
            view.HeightRequest = startHeight + (toHeight - startHeight) * t;
        }, 0, 1, easing ?? Easing.Linear);

        anim.Commit(view, "SizeTo", 16, duration, finished: (_, _) => tcs.TrySetResult(true));
        return tcs.Task;
    }
}
