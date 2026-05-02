using Microsoft.Maui.Devices.Sensors;

namespace AudioGo.Helpers;

/// <summary>
/// Decode Google Encoded Polyline Algorithm Format sang List&lt;Location&gt;.
/// Spec: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
/// </summary>
public static class PolylineDecoder
{
    /// <summary>
    /// Decode encoded polyline string → danh sách tọa độ.
    /// Trả về empty list nếu input null/empty.
    /// </summary>
    public static List<Location> Decode(string? encoded)
    {
        var result = new List<Location>();
        if (string.IsNullOrEmpty(encoded)) return result;

        int index = 0;
        int lat = 0, lng = 0;

        while (index < encoded.Length)
        {
            lat += DecodeChunk(encoded, ref index);
            lng += DecodeChunk(encoded, ref index);
            result.Add(new Location(lat / 1e5, lng / 1e5));
        }

        return result;
    }

    private static int DecodeChunk(string encoded, ref int index)
    {
        int result = 0, shift = 0;

        while (index < encoded.Length)
        {
            int b = encoded[index++] - 63;
            result |= (b & 0x1F) << shift;
            shift += 5;
            if (b < 0x20) break;    // bit thứ 6 = 0 → chunk kết thúc
        }

        // Zig-zag decode: số lẻ → âm, số chẵn → dương
        return (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
    }
}
