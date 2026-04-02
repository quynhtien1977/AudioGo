using System.Globalization;

namespace AudioGo.Helpers;

public static class LanguageHelper
{
    /// <summary>
    /// Lấy mã ngôn ngữ ISO 639-1 từ thiết bị.
    /// Ví dụ: "vi", "en", "ja", "ko", "zh-Hans".
    /// </summary>
    public static string GetDeviceLanguageCode()
    {
        var culture = CultureInfo.CurrentUICulture;
        var lang = culture.TwoLetterISOLanguageName; // "vi", "en", "ja", "ko", "zh"

        // Phân biệt Chinese Simplified vs Traditional
        if (lang == "zh")
        {
            return culture.Name.Contains("Hans", StringComparison.OrdinalIgnoreCase)
                || culture.Name.StartsWith("zh-CN", StringComparison.OrdinalIgnoreCase)
                ? "zh-Hans"
                : "zh-Hant";
        }

        return lang;
    }
}
