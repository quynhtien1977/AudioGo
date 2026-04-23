using System.Globalization;

namespace AudioGo.Helpers;

public static class LanguageHelper
{
    private static readonly HashSet<string> SupportedLanguages = new(StringComparer.OrdinalIgnoreCase)
    {
        "vi", "en", "ja", "ko", "zh-Hans", "fr", "th"
    };

    /// <summary>
    /// Lấy mã ngôn ngữ ISO 639-1 từ thiết bị.
    /// Ví dụ: "vi", "en", "ja", "ko", "zh-Hans".
    /// </summary>
    public static string GetDeviceLanguageCode()
    {
        var culture = CultureInfo.CurrentUICulture;
        var lang = culture.TwoLetterISOLanguageName; // "vi", "en", "ja", "ko", "zh"

        // Phân biệt Chinese Simplified vs Traditional
        string result;
        if (lang == "zh")
        {
            result = culture.Name.Contains("Hans", StringComparison.OrdinalIgnoreCase)
                || culture.Name.StartsWith("zh-CN", StringComparison.OrdinalIgnoreCase)
                ? "zh-Hans"
                : "zh-Hant";
        }
        else
        {
            result = lang;
        }

        return NormalizeToSupported(result);
    }

    public static string NormalizeToSupported(string? languageCode)
    {
        if (string.IsNullOrWhiteSpace(languageCode))
            return "vi";

        var raw = languageCode.Trim();
        if (raw.Equals("zh-Hant", StringComparison.OrdinalIgnoreCase) ||
            raw.Equals("zh", StringComparison.OrdinalIgnoreCase))
        {
            return "zh-Hans";
        }

        if (SupportedLanguages.Contains(raw))
            return raw;

        var twoLetter = raw.Length >= 2 ? raw[..2].ToLowerInvariant() : raw.ToLowerInvariant();
        if (SupportedLanguages.Contains(twoLetter))
            return twoLetter;

        return "en";
    }
}
