using Android.Animation;
using Android.App;
using Android.Views;
using Android.Views.Animations;
using AudioGo_Mobile.Services;
using Microsoft.Maui.Platform;

namespace AudioGo_Mobile.Platforms.Android;

/// <summary>
/// Android implementation of circular-reveal dark-mode transition.
/// Uses native ViewAnimationUtils.CreateCircularReveal().
/// </summary>
public class ThemeTransitionService : IThemeTransitionService
{
    private const int DurationMs = 550;

    public async Task AnimateThemeChangeAsync(bool enableDark, float originX, float originY)
    {
        var activity = (Activity?)Platform.CurrentActivity;
        if (activity?.Window?.DecorView is not ViewGroup decorView)
        {
            // Fallback: just apply theme with no animation
            App.ApplyTheme(enableDark ? "dark" : "light");
            return;
        }

        var tcs = new TaskCompletionSource<bool>();

        activity.RunOnUiThread(() =>
        {
            try
            {
                int width  = decorView.Width;
                int height = decorView.Height;

                int cx = (int)originX;
                int cy = (int)originY;

                // endRadius = diagonal to furthest corner
                double endRadius = Math.Sqrt(
                    Math.Pow(Math.Max(cx, width  - cx), 2) +
                    Math.Pow(Math.Max(cy, height - cy), 2));

                // Create overlay view with the destination theme background color
                var overlayColor = enableDark
                    ? global::Android.Graphics.Color.ParseColor("#0F0F0F")
                    : global::Android.Graphics.Color.ParseColor("#F5F5F5");

                var overlay = new global::Android.Views.View(activity)
                {
                    LayoutParameters = new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MatchParent,
                        ViewGroup.LayoutParams.MatchParent),
                    Visibility = ViewStates.Invisible
                };
                overlay.SetBackgroundColor(overlayColor);
                decorView.AddView(overlay);

                if (!OperatingSystem.IsAndroidVersionAtLeast(21))
                {
                    // Fallback for API < 21
                    App.ApplyTheme(enableDark ? "dark" : "light");
                    decorView.RemoveView(overlay);
                    tcs.TrySetResult(true);
                    return;
                }

                var anim = ViewAnimationUtils.CreateCircularReveal(
                    overlay, cx, cy,
                    startRadius: 0f,
                    endRadius: (float)endRadius);

                anim!.SetDuration(DurationMs);
                anim.SetInterpolator(new AccelerateDecelerateInterpolator());

                anim.AnimationStart += (_, _) =>
                {
                    overlay.Visibility = ViewStates.Visible;
                    // Apply real theme while overlay is covering the screen
                    App.ApplyTheme(enableDark ? "dark" : "light");
                };

                anim.AnimationEnd += (_, _) =>
                {
                    // Fade out overlay (so new theme is revealed underneath)
                    var fadeOut = ObjectAnimator.OfFloat(overlay, "alpha", 1f, 0f)!;
                    fadeOut.SetDuration(180);
                    fadeOut.AnimationEnd += (_, _) =>
                    {
                        decorView.RemoveView(overlay);
                        tcs.TrySetResult(true);
                    };
                    fadeOut.Start();
                };

                overlay.Visibility = ViewStates.Visible;
                anim.Start();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[CircularReveal] Error: {ex.Message}");
                App.ApplyTheme(enableDark ? "dark" : "light");
                tcs.TrySetResult(false);
            }
        });

        await tcs.Task;
    }
}
