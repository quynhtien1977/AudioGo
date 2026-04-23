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

    // ── Delta Sync timestamp ─────────────────────────────────────────────
    private const string LastSyncAtKey = "LastSyncAt";

    /// <summary>
    /// Trả về UTC timestamp của lần đồng bộ delta cuối cùng.
    /// DateTime.MinValue nếu chưa từng sync (→ server sẽ trả toàn bộ changed rows).
    /// </summary>
    public static DateTime GetLastSyncAt()
    {
        var raw = Preferences.Default.Get(LastSyncAtKey, string.Empty);
        if (string.IsNullOrEmpty(raw)) return DateTime.MinValue;
        if (DateTime.TryParse(raw, null,
                System.Globalization.DateTimeStyles.RoundtripKind, out var dt))
            return dt;
        return DateTime.MinValue;
    }

    /// <summary>Lưu timestamp UTC sau mỗi lần delta polling thành công.</summary>
    public static void SetLastSyncAt(DateTime utcNow)
        => Preferences.Default.Set(LastSyncAtKey, utcNow.ToUniversalTime().ToString("O"));
}
