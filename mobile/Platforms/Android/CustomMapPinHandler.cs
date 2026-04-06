using Android.Graphics;
using Android.Gms.Maps.Model;
using Microsoft.Maui.Maps.Handlers;
using AudioGo.Controls;

namespace AudioGo.Platforms.Android;

public static class CustomMapPinHandler
{
    private static readonly HttpClient _httpClient = new HttpClient();
    // LRU/Simple Dictionary Cache for Marker Bitmaps
    private static readonly Dictionary<string, BitmapDescriptor> _markerCache = new();

    public static void Register()
    {
        MapPinHandler.Mapper.AppendToMapping("CustomPin", async (handler, pin) =>
        {
            if (pin is CustomPin customPin)
            {
                await UpdateMarkerIconAsync(handler, customPin);
            }
        });
    }

    private static async Task UpdateMarkerIconAsync(Microsoft.Maui.Maps.Handlers.IMapPinHandler handler, CustomPin customPin)
    {
        var imageUrl = customPin.ImageUrl;
        if (string.IsNullOrEmpty(imageUrl))
            return;

        // Use cached if available
        if (_markerCache.TryGetValue(imageUrl, out var cachedDescriptor))
        {
            SetDescriptor(handler, cachedDescriptor);
            return;
        }

        try
        {
            var imageBytes = await _httpClient.GetByteArrayAsync(imageUrl);
            using var sourceBitmap = BitmapFactory.DecodeByteArray(imageBytes, 0, imageBytes.Length);
            
            if (sourceBitmap != null)
            {
                var customMarkerBitmap = CreateCustomPinBitmap(sourceBitmap);
                var descriptor = BitmapDescriptorFactory.FromBitmap(customMarkerBitmap);
                
                // Cache it
                _markerCache[imageUrl] = descriptor;
                
                // Update marker
                SetDescriptor(handler, descriptor);
                
                customMarkerBitmap.Recycle();
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Failed to load custom pin image: {ex.Message}");
        }
    }

    private static void SetDescriptor(Microsoft.Maui.Maps.Handlers.IMapPinHandler handler, BitmapDescriptor descriptor)
    {
        if (handler.PlatformView is MarkerOptions options)
        {
            options.SetIcon(descriptor);
        }

        // Try dynamically setting the Marker property if it has been instantiated
        var markerProp = handler.GetType().GetProperty("Marker");
        if (markerProp?.GetValue(handler) is Marker createdMarker)
        {
            createdMarker.SetIcon(descriptor);
        }
    }

    private static Bitmap CreateCustomPinBitmap(Bitmap sourceBitmap)
    {
        int width = 120;
        int height = 150;
        int radius = 55;
        int cx = width / 2;
        int cy = 60;

        // Create a mutable bitmap
        var output = Bitmap.CreateBitmap(width, height, Bitmap.Config.Argb8888);
        using var canvas = new Canvas(output);

        // Paints
        using var shadowPaint = new global::Android.Graphics.Paint { AntiAlias = true, Color = global::Android.Graphics.Color.ParseColor("#40000000") };
        using var bgPaint = new global::Android.Graphics.Paint { AntiAlias = true, Color = global::Android.Graphics.Color.White };
        
        using var imagePaint = new global::Android.Graphics.Paint { AntiAlias = true };
        imagePaint.SetXfermode(new PorterDuffXfermode(PorterDuff.Mode.SrcIn));

        // Draw shadow (simple oval under the pin)
        canvas.DrawOval(new global::Android.Graphics.RectF(cx - 30, height - 15, cx + 30, height - 5), shadowPaint);

        // Create Pin path
        using var path = new global::Android.Graphics.Path();
        path.MoveTo(cx, height - 10); // Bottom point
        path.LineTo(cx - 20, cy + 40);
        path.ArcTo(new global::Android.Graphics.RectF(cx - radius, cy - radius, cx + radius, cy + radius), 140, 260, false);
        path.LineTo(cx, height - 10);
        path.Close();

        // Draw white pin background
        canvas.DrawPath(path, bgPaint);

        // Calculate aspect fill rect for image
        int imgSize = radius * 2 - 10;
        float scale = Math.Max((float)imgSize / sourceBitmap.Width, (float)imgSize / sourceBitmap.Height);
        float scaledWidth = scale * sourceBitmap.Width;
        float scaledHeight = scale * sourceBitmap.Height;
        float left = cx - (scaledWidth / 2);
        float top = cy - (scaledHeight / 2);
        var destRect = new global::Android.Graphics.RectF(left, top, left + scaledWidth, top + scaledHeight);

        // Draw Circular Image
        int savedState = canvas.SaveLayer(new global::Android.Graphics.RectF(0, 0, width, height), null);
        
        // Draw mask circle
        canvas.DrawCircle(cx, cy, radius - 8, bgPaint); // using bgPaint as solid alpha mask
        
        // Draw image onto mask
        canvas.DrawBitmap(sourceBitmap, null, destRect, imagePaint);
        
        canvas.RestoreToCount(savedState);

        return output!;
    }
}
