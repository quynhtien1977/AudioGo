using System.Linq;
using System.Windows.Input;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;
using AudioGo.ViewModels;

using AudioGo.Services.Interfaces;

namespace AudioGo_Mobile.ViewModels;

public class WelcomeQrScanViewModel : BaseViewModel
{
    private readonly IApiService _apiService;
    private bool _isDetecting = false;
    public bool IsDetecting
    {
        get => _isDetecting;
        set => SetProperty(ref _isDetecting, value);
    }

    private bool _isLoading = false;
    public bool IsLoading
    {
        get => _isLoading;
        set => SetProperty(ref _isLoading, value);
    }

    public ICommand ProcessBarcodeCommand { get; }

    public WelcomeQrScanViewModel(IApiService apiService)
    {
        _apiService = apiService;
        ProcessBarcodeCommand = new Command<string>(ProcessBarcode);
    }

    private void ProcessBarcode(string barcode)
    {
        if (!string.IsNullOrWhiteSpace(barcode))
        {
            // Đã nhận diện được mã
            IsDetecting = false;
            IsLoading = true;
            
            MainThread.BeginInvokeOnMainThread(async () =>
            {
                // Gọi API check mã QR
                var deviceId = Preferences.Get("AppDeviceId", string.Empty);
                if (string.IsNullOrEmpty(deviceId))
                {
                    deviceId = Guid.NewGuid().ToString();
                    Preferences.Set("AppDeviceId", deviceId);
                }

                var result = await _apiService.ScanQrAsync(barcode, deviceId);

                if (result.IsSuccess)
                {
                    // Lưu Token vào bộ nhớ an toàn
                    if (!string.IsNullOrEmpty(result.Token))
                    {
                        await SecureStorage.SetAsync("GuestToken", result.Token);
                    }

                    Application.Current.MainPage = new AppShell();
                    
                    // Preload tab
                    await Shell.Current.GoToAsync("//Map", animate: false);
                    await Shell.Current.GoToAsync("//Search", animate: false);
                    await Shell.Current.GoToAsync("//Home", animate: false);
                }
                else
                {
                    // Quét thất bại / Hết hạn / Khác Device
                    IsLoading = false;
                    IsDetecting = true; // Bật lại camera cho quét lại
                    
                    await Application.Current.MainPage.DisplayAlert("Lỗi quét mã", result.Message, "OK");
                }
            });
        }
    }
}
