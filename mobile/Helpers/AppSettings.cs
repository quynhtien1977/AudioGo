using Microsoft.Maui.Storage;

namespace AudioGo.Helpers;

public static class AppSettings
{
    private const string AppLanguageKey = "AppLanguage";
    private const string AllowCellularDownloadsKey = "AllowCellularDownloads";

    public static string GetAppLanguage()
    {
        var saved = Preferences.Default.Get(AppLanguageKey, string.Empty);
        if (!string.IsNullOrWhiteSpace(saved))
            return LanguageHelper.NormalizeToSupported(saved);

        return LanguageHelper.GetDeviceLanguageCode();
    }

    public static void SetAppLanguage(string languageCode)
    {
        var normalized = LanguageHelper.NormalizeToSupported(languageCode);
        Preferences.Default.Set(AppLanguageKey, normalized);
    }

    public static bool IsCellularDownloadsAllowed()
        => Preferences.Default.Get(AllowCellularDownloadsKey, false);

    public static void SetCellularDownloadsAllowed(bool allowed)
        => Preferences.Default.Set(AllowCellularDownloadsKey, allowed);
}
