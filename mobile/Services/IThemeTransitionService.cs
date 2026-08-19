namespace AudioGo_Mobile.Services;

/// <summary>
/// Platform-agnostic interface for the circular-reveal dark-mode transition.
/// iOS/Windows will use a simple fade. Android gets the native ViewAnimationUtils reveal.
/// </summary>
public interface IThemeTransitionService
{
    /// <summary>
    /// Trigger circular reveal animation then apply theme.
    /// </summary>
    /// <param name="enableDark">True = go dark, False = go light.</param>
    /// <param name="originX">X coordinate of the toggle button (in device pixels).</param>
    /// <param name="originY">Y coordinate of the toggle button (in device pixels).</param>
    Task AnimateThemeChangeAsync(bool enableDark, float originX, float originY);
}
