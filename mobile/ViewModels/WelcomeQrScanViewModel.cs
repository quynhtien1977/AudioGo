using System.Windows.Input;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;
using AudioGo.ViewModels;
using AudioGo.Services.Interfaces;

namespace AudioGo_Mobile.ViewModels;

public class WelcomeQrScanViewModel : BaseViewModel
{
    private readonly IApiService _apiService;

    // ── Guard: ngăn scanner trigger xử lý 2 lần trong cùng 1 scan ──
    private bool _isProcessing = false;

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
        // Guard: scanner có thể trigger nhiều lần liên tiếp với cùng 1 mã
        if (_isProcessing || string.IsNullOrWhiteSpace(barcode)) return;
        _isProcessing = true;

        IsDetecting = false;
        IsLoading = true;

        MainThread.BeginInvokeOnMainThread(async () =>
        {
            try
            {
                // Lấy DeviceId ổn định — persist qua SecureStorage
                var deviceId = await SecureStorage.GetAsync("AppDeviceId");
                if (string.IsNullOrEmpty(deviceId))
                {
                    var rawId = $"{DeviceInfo.Current.Name}_{DeviceInfo.Current.Model}_{DeviceInfo.Current.Manufacturer}_{DeviceInfo.Current.Platform}";
                    deviceId = Convert.ToHexString(
                        System.Security.Cryptography.SHA256.HashData(
                            System.Text.Encoding.UTF8.GetBytes(rawId))
                    )[..16];
                    await SecureStorage.SetAsync("AppDeviceId", deviceId);
                }

                var result = await _apiService.ScanQrAsync(barcode, deviceId);

                if (result.IsSuccess)
                {
                    if (!string.IsNullOrEmpty(result.Token))
                        await SecureStorage.SetAsync("GuestToken", result.Token);

                    App.MarkSessionValid();

                    // ── FIX CRITICAL: lấy AppShell từ DI thay vì "new AppShell()" ──
                    // Lý do: new AppShell() tạo Shell ngoài DI container.
                    // Khi Shell render DataTemplate views:MainPage, MAUI dùng
                    // Activator.CreateInstance (không qua DI) → MainPage không nhận
                    // được MainViewModel qua constructor → NullReferenceException → crash.
                    // Giải pháp: lấy AppShell đã được đăng ký Singleton trong MauiProgram.
                    var services = IPlatformApplication.Current!.Services;
                    var shell = services.GetRequiredService<AppShell>();
                    Application.Current!.MainPage = shell;

                    // ── Không preload tabs bằng GoToAsync ──────────────────
                    // GoToAsync("//Map"), ("//Search"), ("//Home") gọi ngay sau khi set
                    // MainPage khiến MainViewModel.InitAsync() chạy 3 lần song song,
                    // tranh CPU/network với SyncService download batch đầu tiên.
                    // MAUI sẽ tự render tab Home (default) theo AppShell.xaml.
                }
                else
                {
                    IsLoading = false;
                    IsDetecting = true; // Bật lại camera
                    _isProcessing = false; // Cho phép scan lại khi thất bại

                    await Application.Current!.MainPage!.DisplayAlert(
                        "Lỗi quét mã", result.Message, "OK");
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[QrScan] Error: {ex.Message}");
                IsLoading = false;
                IsDetecting = true;
                _isProcessing = false;
            }
        });
    }
}
