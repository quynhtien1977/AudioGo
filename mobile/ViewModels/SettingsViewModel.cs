using AudioGo.Helpers;
using CommunityToolkit.Maui.Views;
using AudioGo_Mobile.Views;
using System.Windows.Input;

namespace AudioGo.ViewModels
{
    public class SettingsViewModel : BaseViewModel
    {
        private readonly MainViewModel _mainVm;
        private bool _isChangingLanguage;

        public bool AllowCellularDownloads
        {
            get => _mainVm.AllowCellularDownloads;
            set
            {
                if (_mainVm.AllowCellularDownloads != value)
                {
                    _ = _mainVm.SetCellularDownloadsAsync(value);
                    OnPropertyChanged();
                    OnPropertyChanged(nameof(DownloadPolicyLabel));
                }
            }
        }

        public string DownloadPolicyLabel => _mainVm.DownloadPolicyLabel;

        public string CurrentLanguage => _mainVm.CurrentLanguage;

        public string CurrentLanguageName => _mainVm.CurrentLanguage switch
        {
            "vi" => "Tiếng Việt",
            "en" => "English",
            "ko" => "한국어",
            "ja" => "日本語",
            "zh-Hans" => "中文",
            "fr" => "Français",
            "th" => "ภาษาไทย",
            _ => _mainVm.CurrentLanguage
        };

        // Localized UI labels
        public string LabelLanguageSection => AppStrings.Get("settings_language");
        public string LabelDownloadSection => AppStrings.Get("settings_download");
        public string LabelCellularToggle => AppStrings.Get("settings_cellular");
        public string LabelAppVersion => AppStrings.Get("settings_version");
        public string PageTitle => AppStrings.Get("tab_settings");

        public ICommand ChangeLanguageCommand { get; }

        public SettingsViewModel(MainViewModel mainVm)
        {
            _mainVm = mainVm;
            ChangeLanguageCommand = new Command<string>(async (lang) => await ChangeLanguageAsync(lang));
        }

        public async Task ChangeLanguageAsync(string lang)
        {
            if (string.IsNullOrWhiteSpace(lang) || _isChangingLanguage) return;

            _isChangingLanguage = true;
            try
            {
                await _mainVm.ChangeLanguageAsync(lang);

                RefreshLocalization();

                var langName = lang switch
                {
                    "vi" => "Tiếng Việt",
                    "en" => "English",
                    "ko" => "한국어",
                    "ja" => "日本語",
                    "zh-Hans" => "中文",
                    "fr" => "Français",
                    "th" => "ภาษาไทย",
                    _ => lang
                };

                var successMsg = AppStrings.GetForLanguage("lang_switch_success", lang);
                var successTitle = AppStrings.GetForLanguage("lang_switch_success_title", lang);
                var okLabel = AppStrings.GetForLanguage("ok", lang);

                if (Application.Current?.MainPage is not null)
                {
                    await Application.Current.MainPage.ShowPopupAsync(
                        new CustomAlertPopup(successTitle, $"{successMsg} {langName}", okLabel));
                }
            }
            catch (Exception)
            {
                var errTitle = AppStrings.Get("lang_switch_error_title");
                var errMsg = AppStrings.Get("lang_switch_error_msg");
                var closeBtn = AppStrings.Get("close");

                if (Application.Current?.MainPage is not null)
                {
                    await Application.Current.MainPage.ShowPopupAsync(
                        new CustomAlertPopup(errTitle, errMsg, closeBtn));
                }
            }
            finally
            {
                _isChangingLanguage = false;
            }
        }

        public void RefreshLocalization()
        {
            OnPropertyChanged(nameof(CurrentLanguage));
            OnPropertyChanged(nameof(CurrentLanguageName));
            OnPropertyChanged(nameof(LabelLanguageSection));
            OnPropertyChanged(nameof(LabelDownloadSection));
            OnPropertyChanged(nameof(LabelCellularToggle));
            OnPropertyChanged(nameof(LabelAppVersion));
            OnPropertyChanged(nameof(PageTitle));
            OnPropertyChanged(nameof(DownloadPolicyLabel));
        }
    }
}
