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
                // Lấy DeviceId ổn định — dùng SecureStorage để persist qua reinstall
                // (Preferences có thể bị xóa khi uninstall trên Android)
                var deviceId = await SecureStorage.GetAsync("AppDeviceId");
                if (string.IsNullOrEmpty(deviceId))
                {
                    // Tạo ID từ thông tin phần cứng để ổn định hơn GUID thuần túy
                    var rawId = $"{DeviceInfo.Current.Name}_{DeviceInfo.Current.Model}_{DeviceInfo.Current.Manufacturer}_{DeviceInfo.Current.Platform}";
                    // Hash thành chuỗi ngắn gọn, deterministic
                    deviceId = Convert.ToHexString(
                        System.Security.Cryptography.SHA256.HashData(
                            System.Text.Encoding.UTF8.GetBytes(rawId)
                        )
                    )[..16]; // Lấy 16 ký tự đầu là đủ unique
                    await SecureStorage.SetAsync("AppDeviceId", deviceId);
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
