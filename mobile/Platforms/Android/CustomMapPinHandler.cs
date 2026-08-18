using Android.Graphics;
using Android.Gms.Maps.Model;
using Microsoft.Maui.Maps.Handlers;
using AudioGo.Controls;

namespace AudioGo.Platforms.Android;

public static class CustomMapPinHandler
{
    private static readonly HttpClient _httpClient = new HttpClient();

    // Cache: imageUrl → BitmapDescriptor (ready to set on Marker)
    private static readonly Dictionary<string, BitmapDescriptor> _markerCache = new();

    // Track in-progress downloads to avoid duplicate requests
    private static readonly HashSet<string> _downloading = new();

    public static void Register()
    {
        MapPinHandler.Mapper.AppendToMapping("CustomPin", async (handler, pin) =>
        {
            if (pin is CustomPin customPin)
            {
                // Numbered pin (tour mini map) — ưu tiên hơn logo
                if (customPin.StepNumber > 0)
                {
                    var descriptor = CreateNumberedPinDescriptor(customPin.StepNumber);
                    await SetDescriptorWithRetryAsync(handler, descriptor);
                    return;
                }

                await UpdateMarkerIconAsync(handler, customPin);
            }
        });
    }

    /// <summary>Tạo BitmapDescriptor với số thứ tự (không cache vì số nhỏ).</summary>
    private static BitmapDescriptor CreateNumberedPinDescriptor(int stepNumber)
    {
        var bmp = CreateNumberedPinBitmap(stepNumber);
        var descriptor = BitmapDescriptorFactory.FromBitmap(bmp);
        bmp.Recycle();
        return descriptor;
    }

    /// <summary>
    /// S3-2: Pre-warms the icon cache for all POI logo URLs.
    /// Call this right after POI list is loaded, BEFORE entering MapPage.
    /// </summary>
    public static async Task PreloadIconsAsync(IEnumerable<string?> urls)
    {
        var tasks = urls
            .Where(u => !string.IsNullOrEmpty(u) && !_markerCache.ContainsKey(u!))
            .Distinct()
            .Select(u => DownloadAndCacheAsync(u!));

        await Task.WhenAll(tasks);
        #if DEBUG
        System.Diagnostics.Debug.WriteLine($"[PinCache] Preloaded {_markerCache.Count} icons.");
        #endif
    }

    /// <summary>
    /// S3-1: Downloads image bytes and stores the BitmapDescriptor in cache.
    /// Does NOT set anything on a handler — safe to call from any thread.
    /// </summary>
    private static async Task DownloadAndCacheAsync(string imageUrl)
    {
        if (_markerCache.ContainsKey(imageUrl)) return;

        // Guard against concurrent duplicate downloads
        lock (_downloading)
        {
            if (_downloading.Contains(imageUrl)) return;
            _downloading.Add(imageUrl);
        }

        try
        {
            byte[] imageBytes;
            if (imageUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            {
                imageBytes = await _httpClient.GetByteArrayAsync(imageUrl);
            }
            else if (File.Exists(imageUrl))
            {
                imageBytes = await File.ReadAllBytesAsync(imageUrl);
            }
            else
            {
                return;
            }

            using var sourceBitmap = BitmapFactory.DecodeByteArray(imageBytes, 0, imageBytes.Length);
            if (sourceBitmap != null)
            {
                var customMarkerBitmap = CreateCustomPinBitmap(sourceBitmap);
                var descriptor = BitmapDescriptorFactory.FromBitmap(customMarkerBitmap);
                _markerCache[imageUrl] = descriptor;
                customMarkerBitmap.Recycle();
            }
        }
        catch (Exception ex)
        {
            #if DEBUG
            System.Diagnostics.Debug.WriteLine($"[PinCache] Failed to cache {imageUrl}: {ex.Message}");
            #endif
        }
        finally
        {
            lock (_downloading)
                _downloading.Remove(imageUrl);
        }
    }

    private static async Task UpdateMarkerIconAsync(IMapPinHandler handler, CustomPin customPin)
    {
        var imageUrl = customPin.ImageUrl;
        if (string.IsNullOrEmpty(imageUrl)) return;

        // Cache hit — set synchronously before MarkerOptions is committed to the map
        if (_markerCache.TryGetValue(imageUrl, out var cachedDescriptor))
        {
            await SetDescriptorWithRetryAsync(handler, cachedDescriptor);
            return;
        }

        // Cache miss — download first, then retry set
        await DownloadAndCacheAsync(imageUrl);

        if (_markerCache.TryGetValue(imageUrl, out var descriptor))
        {
            await SetDescriptorWithRetryAsync(handler, descriptor);
        }
    }

    /// <summary>
    /// S3-4: Tries to set the icon. If the Marker hasn't been committed yet,
    /// retries up to 8 times with 30ms gaps (total max wait ~240ms).
    /// </summary>
    private static async Task SetDescriptorWithRetryAsync(IMapPinHandler handler, BitmapDescriptor descriptor)
    {
        // Attempt 1: set on MarkerOptions (runs BEFORE map commits the marker)
        if (handler.PlatformView is MarkerOptions options)
            options.SetIcon(descriptor);

        // Attempt 2+: poll for Marker (runs AFTER map commits)
        var markerProp = handler.GetType().GetProperty("Marker");
        for (int i = 0; i < 8; i++)
        {
            if (markerProp?.GetValue(handler) is Marker createdMarker)
            {
                createdMarker.SetIcon(descriptor);
                return; // success
            }
            await Task.Delay(30);
        }
    }

    private static Bitmap CreateCustomPinBitmap(Bitmap sourceBitmap)
    {
        int width = 120;
        int height = 150;
        int radius = 55;
        int cx = width / 2;
        int cy = 60;

        var output = Bitmap.CreateBitmap(width, height, Bitmap.Config.Argb8888);
        using var canvas = new Canvas(output);

        using var shadowPaint = new global::Android.Graphics.Paint { AntiAlias = true, Color = global::Android.Graphics.Color.ParseColor("#40000000") };
        using var bgPaint = new global::Android.Graphics.Paint { AntiAlias = true, Color = global::Android.Graphics.Color.White };
        using var imagePaint = new global::Android.Graphics.Paint { AntiAlias = true };
        imagePaint.SetXfermode(new PorterDuffXfermode(PorterDuff.Mode.SrcIn));

        // Shadow
        canvas.DrawOval(new global::Android.Graphics.RectF(cx - 30, height - 15, cx + 30, height - 5), shadowPaint);

        // Pin shape
        using var path = new global::Android.Graphics.Path();
        path.MoveTo(cx, height - 10);
        path.LineTo(cx - 20, cy + 40);
        path.ArcTo(new global::Android.Graphics.RectF(cx - radius, cy - radius, cx + radius, cy + radius), 140, 260, false);
        path.LineTo(cx, height - 10);
        path.Close();
        canvas.DrawPath(path, bgPaint);

        // Circular image crop
        int imgSize = radius * 2 - 10;
        float scale = Math.Max((float)imgSize / sourceBitmap.Width, (float)imgSize / sourceBitmap.Height);
        float scaledWidth = scale * sourceBitmap.Width;
        float scaledHeight = scale * sourceBitmap.Height;
        float left = cx - (scaledWidth / 2);
        float top = cy - (scaledHeight / 2);
        var destRect = new global::Android.Graphics.RectF(left, top, left + scaledWidth, top + scaledHeight);

        int savedState = canvas.SaveLayer(new global::Android.Graphics.RectF(0, 0, width, height), null);
        canvas.DrawCircle(cx, cy, radius - 8, bgPaint);
        canvas.DrawBitmap(sourceBitmap, null, destRect, imagePaint);
        canvas.RestoreToCount(savedState);

        return output!;
    }

    /// <summary>
    /// Vẽ pin hình giọt nước màu Primary (#D15993) với số thứ tự trắng ở giữa.
    /// Dùng cho mini map trong TourDetailPage.
    /// </summary>
    private static Bitmap CreateNumberedPinBitmap(int stepNumber)
    {
        int width  = 96;
        int height = 120;
        int radius = 40;
        int cx = width / 2;
        int cy = 44;

        var output = Bitmap.CreateBitmap(width, height, Bitmap.Config.Argb8888);
        using var canvas = new Canvas(output);

        // Shadow
        using var shadowPaint = new global::Android.Graphics.Paint
            { AntiAlias = true, Color = global::Android.Graphics.Color.ParseColor("#40000000") };
        canvas.DrawOval(new global::Android.Graphics.RectF(cx - 24, height - 12, cx + 24, height - 4), shadowPaint);

        // Pin shape (Primary color)
        using var pinPaint = new global::Android.Graphics.Paint
            { AntiAlias = true, Color = global::Android.Graphics.Color.ParseColor("#E53935") };
        using var path = new global::Android.Graphics.Path();
        path.MoveTo(cx, height - 8);
        path.LineTo(cx - 16, cy + 32);
        path.ArcTo(new global::Android.Graphics.RectF(cx - radius, cy - radius, cx + radius, cy + radius), 140, 260, false);
        path.LineTo(cx, height - 8);
        path.Close();
        canvas.DrawPath(path, pinPaint);

        // White circle background
        using var circlePaint = new global::Android.Graphics.Paint
            { AntiAlias = true, Color = global::Android.Graphics.Color.White };
        canvas.DrawCircle(cx, cy, radius - 8, circlePaint);

        // Step number text
        using var textPaint = new global::Android.Graphics.Paint
        {
            AntiAlias  = true,
            Color      = global::Android.Graphics.Color.ParseColor("#E53935"),
            TextSize   = 28,
            TextAlign  = global::Android.Graphics.Paint.Align.Center,
            FakeBoldText = true,
        };
        // Vertical center: measure text height
        var bounds = new global::Android.Graphics.Rect();
        textPaint.GetTextBounds(stepNumber.ToString(), 0, stepNumber.ToString().Length, bounds);
        float textY = cy + bounds.Height() / 2f;
        canvas.DrawText(stepNumber.ToString(), cx, textY, textPaint);

        return output!;
    }
}
