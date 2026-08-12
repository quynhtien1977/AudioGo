using AudioGo.Helpers;
using AudioGo.ViewModels;

namespace AudioGo_Mobile.Views;

public partial class SettingsPage : ContentPage
{
    private readonly SettingsViewModel _vm;

    public SettingsPage(SettingsViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    /// <summary>
    /// Triggered by the moon/sun icon button in the header.
    /// Calculates the button's center position in device pixels and starts circular reveal.
    /// </summary>
    private async void OnDarkModeToggleTapped(object sender, TappedEventArgs e)
    {
        try
        {
            var density = DeviceDisplay.MainDisplayInfo.Density;

            // Accumulate absolute position by walking up the visual tree
            double absX = DarkModeToggleBtn.X + DarkModeToggleBtn.Width  / 2.0;
            double absY = DarkModeToggleBtn.Y + DarkModeToggleBtn.Height / 2.0;

            Element? el = DarkModeToggleBtn.Parent;
            while (el is VisualElement ve && el is not Page)
            {
                absX += ve.X;
                absY += ve.Y;
                el    = ve.Parent;
            }

            // Convert logical units → device pixels
            var px = (float)(absX * density);
            var py = (float)(absY * density);

            await _vm.AnimateThemeAsync(!_vm.IsDarkMode, px, py);
        }
        catch
        {
            // Fallback without animation
            await _vm.AnimateThemeAsync(!_vm.IsDarkMode, 0, 0);
        }
    }

    private async void OnChangeLanguageClicked(object sender, EventArgs e)
    {
        // Title and cancel label are localized in the current language
        var sheetTitle  = AppStrings.Get("settings_lang_sheet_title");
        var cancelLabel = AppStrings.Get("settings_lang_sheet_cancel");

        var result = await DisplayActionSheet(
            sheetTitle,
            cancelLabel,
            null,
            "🇻🇳 Tiếng Việt",
            "🇬🇧 English",
            "🇨🇳 中文",
            "🇯🇵 日本語",
            "🇰🇷 한국어",
            "🇫🇷 Français",
            "🇹🇭 ภาษาไทย");

        var langCode = result switch
        {
            "🇻🇳 Tiếng Việt"  => "vi",
            "🇬🇧 English"     => "en",
            "🇨🇳 中文"        => "zh-Hans",
            "🇯🇵 日本語"       => "ja",
            "🇰🇷 한국어"       => "ko",
            "🇫🇷 Français"    => "fr",
            "🇹🇭 ภาษาไทย"    => "th",
            _                 => null
        };

        if (langCode is not null)
            await _vm.ChangeLanguageAsync(langCode);
    }
}
