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
        var result = await DisplayActionSheet("Chọn ngôn ngữ", "Hủy", null, 
            "🇻🇳 Tiếng Việt", 
            "🇬🇧 English", 
            "🇨🇳 中文", 
            "🇯🇵 日本語", 
            "🇰🇷 한국어",
            "🇫🇷 Français",
            "🇪🇸 Español");

        var langCode = result switch
        {
            "🇻🇳 Tiếng Việt" => "vi",
            "🇬🇧 English" => "en",
            "🇨🇳 中文" => "zh-Hans",
            "🇯🇵 日本語" => "ja",
            "🇰🇷 한국어" => "ko",
            "🇫🇷 Français" => "fr",
            "🇪🇸 Español" => "es",
            _ => null
        };

        if (langCode != null)
        {
            if (_vm.ChangeLanguageCommand.CanExecute(langCode))
            {
                _vm.ChangeLanguageCommand.Execute(langCode);
            }
        }
    }
}
