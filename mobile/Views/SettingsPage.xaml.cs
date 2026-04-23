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
