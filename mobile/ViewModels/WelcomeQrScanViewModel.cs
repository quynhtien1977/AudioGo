using System.Linq;
using System.Windows.Input;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;
using AudioGo.ViewModels;

namespace AudioGo_Mobile.ViewModels;

public class WelcomeQrScanViewModel : BaseViewModel
{
    private bool _isDetecting = false;
    public bool IsDetecting
    {
        get => _isDetecting;
        set => SetProperty(ref _isDetecting, value);
    }

    public ICommand ProcessBarcodeCommand { get; }

    public WelcomeQrScanViewModel()
    {
        ProcessBarcodeCommand = new Command<string>(ProcessBarcode);
    }

    private void ProcessBarcode(string barcode)
    {
        if (!string.IsNullOrWhiteSpace(barcode))
        {
            // Đã nhận diện được mã
            IsDetecting = false;
            
            // Xử lý quét mã QR tại đây. 
            // Tạm thời bỏ qua validate nội dung QR và chuyển ứng dụng vào trang chủ ngay lập tức.
            MainThread.BeginInvokeOnMainThread(() =>
            {
                Application.Current.MainPage = new AppShell();
            });
        }
    }
}
