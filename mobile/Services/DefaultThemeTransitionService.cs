namespace AudioGo_Mobile.Services;

/// <summary>
/// Default fallback for non-Android/iOS platforms (Windows, MacCatalyst).
/// </summary>
public class DefaultThemeTransitionService : IThemeTransitionService
{
    public Task AnimateThemeChangeAsync(bool enableDark, float originX, float originY)
    {
        App.ApplyTheme(enableDark ? "dark" : "light");
        return Task.CompletedTask;
    }
}
