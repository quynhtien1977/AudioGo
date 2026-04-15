using AudioGo.Services;
using Shared;
using System.Windows.Input;
using CommunityToolkit.Maui.Views;
using AudioGo_Mobile.Views;

namespace AudioGo.ViewModels
{
    public class SettingsViewModel : BaseViewModel
    {
        private readonly MainViewModel _mainVm;

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
            "zh-Hant" => "中文",
            "fr" => "Français",
            "es" => "Español",
            _ => _mainVm.CurrentLanguage
        };
        public ICommand ChangeLanguageCommand { get; }

        public SettingsViewModel(MainViewModel mainVm)
        {
            _mainVm = mainVm;

            ChangeLanguageCommand = new Command<string>(async (lang) =>
            {
                try
                {
                    await _mainVm.ChangeLanguageAsync(lang);
                    OnPropertyChanged(nameof(CurrentLanguage));
                    OnPropertyChanged(nameof(CurrentLanguageName));
                    
                    var langName = lang switch {
                        "vi" => "Tiếng Việt",
                        "en" => "English",
                        "ko" => "한국어",
                        "ja" => "日本語",
                        "zh-Hans" => "中文",
                        "fr" => "Français",
                        "es" => "Español",
                        _ => lang
                    };
                    
                    await Application.Current.MainPage.ShowPopupAsync(new CustomAlertPopup("Thành công", $"Đã chuyển ngôn ngữ sang {langName}", "OK"));
                }
                catch (Exception)
                {
                    await Application.Current.MainPage.ShowPopupAsync(new CustomAlertPopup("Lỗi cập nhật", "Không thể đổi ngôn ngữ do không tải được dữ liệu. Vui lòng kết nối Wi-Fi hoặc bật 'Tải qua 4G/5G'.", "Đóng"));
                }
            });
        }
    }
}
