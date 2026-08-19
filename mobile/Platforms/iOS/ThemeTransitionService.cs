using AudioGo_Mobile.Services;

namespace AudioGo_Mobile.Platforms.iOS;

/// <summary>
/// iOS fallback — simple instant theme switch (no circular reveal on iOS).
/// </summary>
public class ThemeTransitionService : IThemeTransitionService
{
    public Task AnimateThemeChangeAsync(bool enableDark, float originX, float originY)
    {
        App.ApplyTheme(enableDark ? "dark" : "light");
        return Task.CompletedTask;
    }
}
