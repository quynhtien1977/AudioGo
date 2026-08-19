using Android.Animation;
using Android.App;
using Android.Graphics;
using Android.OS;
using Android.Views;
using Android.Views.Animations;
using AudioGo_Mobile.Services;
using Microsoft.Maui.Platform;

namespace AudioGo_Mobile.Platforms.Android;

/// <summary>
/// Android circular reveal — đúng chuẩn Material Design:
/// 1. Chụp bitmap màn hình hiện tại
/// 2. Apply theme ngay (content đổi màu bên dưới)
/// 3. Đặt bitmap cũ làm overlay toàn màn hình
/// 4. Circular SHRINK overlay từ vị trí nút → lộ nội dung mới bên dưới
/// Nội dung không bao giờ bị che hoàn toàn.
/// </summary>
public class ThemeTransitionService : IThemeTransitionService
{
    private const int RevealDurationMs = 500;

    public async Task AnimateThemeChangeAsync(bool enableDark, float originX, float originY)
    {
        var activity = (Activity?)Platform.CurrentActivity;
        if (activity?.Window?.DecorView is not ViewGroup decorView)
        {
            App.ApplyTheme(enableDark ? "dark" : "light");
            return;
        }

        var tcs = new TaskCompletionSource<bool>();

        activity.RunOnUiThread(async () =>
        {
            try
            {
                // ── Step 1: Chụp bitmap màn hình hiện tại ──────────────
                Bitmap? screenshot = await CaptureScreenAsync(activity, decorView);

                // ── Step 2: Apply theme ngay (content đổi màu bên dưới) ──
                App.ApplyTheme(enableDark ? "dark" : "light");

                if (screenshot == null)
                {
                    // Không chụp được → fallback không animation
                    tcs.TrySetResult(false);
                    return;
                }

                // ── Step 3: Đặt ImageView chứa screenshot làm overlay ───
                var overlay = new global::Android.Widget.ImageView(activity)
                {
                    LayoutParameters = new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MatchParent,
                        ViewGroup.LayoutParams.MatchParent)
                };
                overlay.SetImageBitmap(screenshot);
                overlay.SetScaleType(global::Android.Widget.ImageView.ScaleType.FitXy);
                decorView.AddView(overlay);

                // ── Step 4: Circular SHRINK — overlay co lại từ vị trí nút ─
                int cx = (int)originX;
                int cy = (int)originY;

                // startRadius = đường chéo màn hình (đủ phủ toàn màn)
                double startRadius = Math.Sqrt(
                    Math.Pow(Math.Max(cx, decorView.Width  - cx), 2) +
                    Math.Pow(Math.Max(cy, decorView.Height - cy), 2));

                if (!OperatingSystem.IsAndroidVersionAtLeast(21))
                {
                    // API < 21 fallback
                    decorView.RemoveView(overlay);
                    screenshot.Recycle();
                    tcs.TrySetResult(true);
                    return;
                }

                // Reveal từ full screen → shrink về điểm nút (reverse reveal)
                var anim = ViewAnimationUtils.CreateCircularReveal(
                    overlay,
                    cx, cy,
                    startRadius: (float)startRadius,   // bắt đầu to (phủ hết)
                    endRadius: 0f);                     // kết thúc = 0 (biến mất)

                anim!.SetDuration(RevealDurationMs);
                anim.SetInterpolator(new AccelerateDecelerateInterpolator());

                anim.AnimationEnd += (_, _) =>
                {
                    decorView.RemoveView(overlay);
                    screenshot.Recycle();
                    tcs.TrySetResult(true);
                };

                anim.Start();
            }
            catch (Exception ex)
            {
                #if DEBUG
                System.Diagnostics.Debug.WriteLine($"[CircularReveal] Error: {ex.Message}");
                #endif
                App.ApplyTheme(enableDark ? "dark" : "light");
                tcs.TrySetResult(false);
            }
        });

        await tcs.Task;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Chụp screenshot bằng PixelCopy (API 26+) hoặc Canvas.DrawingCache (cũ)
    // ────────────────────────────────────────────────────────────────────────
    private static Task<Bitmap?> CaptureScreenAsync(Activity activity, global::Android.Views.View decorView)
    {
        var captureTcs = new TaskCompletionSource<Bitmap?>();

        if (OperatingSystem.IsAndroidVersionAtLeast(26) && activity.Window != null)
        {
            try
            {
                var bitmap = Bitmap.CreateBitmap(
                    decorView.Width, decorView.Height, Bitmap.Config.Argb8888!);

                var listener = new PixelCopyListener(result =>
                {
                    if (result == (int)PixelCopyResult.Success)
                        captureTcs.TrySetResult(bitmap);
                    else
                    {
                        bitmap.Recycle();
                        captureTcs.TrySetResult(null);
                    }
                });

                PixelCopy.Request(
                    activity.Window,
                    bitmap,
                    listener,
                    new global::Android.OS.Handler(Looper.MainLooper!));
            }
            catch
            {
                captureTcs.TrySetResult(null);
            }
        }
        else
        {
            // Fallback — DrawingCache (API 21-25)
            try
            {
#pragma warning disable CS0618
                decorView.DrawingCacheEnabled = true;
                var cache = decorView.DrawingCache;
                var copy  = cache != null ? Bitmap.CreateBitmap(cache) : null;
                decorView.DrawingCacheEnabled = false;
#pragma warning restore CS0618
                captureTcs.TrySetResult(copy);
            }
            catch
            {
                captureTcs.TrySetResult(null);
            }
        }

        return captureTcs.Task;
    }

    // PixelCopy callback wrapper — .NET Android binding requires explicit interface
    private sealed class PixelCopyListener : Java.Lang.Object, PixelCopy.IOnPixelCopyFinishedListener
    {
        private readonly Action<int> _callback;
        public PixelCopyListener(Action<int> callback) => _callback = callback;
        public void OnPixelCopyFinished(int copyResult) => _callback(copyResult);
    }
}
