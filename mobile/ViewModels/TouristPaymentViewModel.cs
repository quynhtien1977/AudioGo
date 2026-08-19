using System.Windows.Input;
using AudioGo.Helpers;
using AudioGo.Services.Interfaces;
using AudioGo.ViewModels;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.ApplicationModel.DataTransfer;
using Microsoft.Maui.Controls;

namespace AudioGo_Mobile.ViewModels;

public enum PaymentState { Initializing, Waiting, Success, Failed }

public class TouristPaymentViewModel : BaseViewModel
{
    private readonly IApiService _api;
    private CancellationTokenSource? _pollCts;

    // ── State machine ─────────────────────────────────────────────────────────
    private PaymentState _currentState = PaymentState.Initializing;
    public PaymentState CurrentState
    {
        get => _currentState;
        set
        {
            if (SetProperty(ref _currentState, value))
            {
                OnPropertyChanged(nameof(IsInitializingState));
                OnPropertyChanged(nameof(IsWaitingState));
                OnPropertyChanged(nameof(IsSuccessState));
                OnPropertyChanged(nameof(IsFailedState));
            }
        }
    }

    public bool IsInitializingState => CurrentState == PaymentState.Initializing;
    public bool IsWaitingState => CurrentState == PaymentState.Waiting;
    public bool IsSuccessState => CurrentState == PaymentState.Success;
    public bool IsFailedState  => CurrentState == PaymentState.Failed;

    // ── Binding props ─────────────────────────────────────────────────────────
    private string _transactionId = "";
    public string TransactionId
    {
        get => _transactionId;
        set => SetProperty(ref _transactionId, value);
    }

    private string _transferContent = "";
    public string TransferContent
    {
        get => _transferContent;
        set => SetProperty(ref _transferContent, value);
    }

    private decimal _amount;
    public decimal Amount
    {
        get => _amount;
        set => SetProperty(ref _amount, value);
    }

    private string _vietQrUrl = "";
    public string VietQrUrl
    {
        get => _vietQrUrl;
        set => SetProperty(ref _vietQrUrl, value);
    }

    private string _bankInfo = "";
    public string BankInfo
    {
        get => _bankInfo;
        set => SetProperty(ref _bankInfo, value);
    }

    private string _statusMessage = "";
    public string StatusMessage
    {
        get => _statusMessage;
        set => SetProperty(ref _statusMessage, value);
    }

    private bool _isBusy;
    public bool IsBusy
    {
        get => _isBusy;
        set => SetProperty(ref _isBusy, value);
    }

    private int _secondsElapsed;
    public int SecondsElapsed
    {
        get => _secondsElapsed;
        set => SetProperty(ref _secondsElapsed, value);
    }

    // ── Commands ──────────────────────────────────────────────────────────────
    public ICommand InitPaymentCommand      { get; }
    public ICommand CopyTransferContentCommand { get; }
    public ICommand CancelCommand           { get; }
    public ICommand RetryCommand            { get; }
    public ICommand EnterAppCommand         { get; }
    public ICommand ManualVerifyCommand     { get; }

    public TouristPaymentViewModel(IApiService api)
    {
        _api = api;

        InitPaymentCommand = new Command(
            execute:  async () => await DoInitPaymentAsync(),
            canExecute: () => !IsBusy
        );

        CopyTransferContentCommand = new Command(async () =>
        {
            if (string.IsNullOrEmpty(TransferContent)) return;
            await Clipboard.SetTextAsync(TransferContent);
            StatusMessage = AppStrings.Get("pay_copy_done");
            await Task.Delay(2000);
            if (CurrentState == PaymentState.Waiting)
                StatusMessage = "";
        });

        CancelCommand = new Command(async () =>
        {
            _pollCts?.Cancel();
            await Shell.Current?.Navigation?.PopAsync();
        });

        ManualVerifyCommand = new Command(async () =>
        {
            StatusMessage = "Đang kiểm tra lại...";
            var deviceId = await GetOrCreateDeviceId();
            var verify = await _api.VerifyTouristPaymentAsync(TransactionId, deviceId, CancellationToken.None);
            if (verify?.Status == "SUCCESS")
            {
                if (!string.IsNullOrEmpty(verify.Token))
                    await SecureStorage.SetAsync("GuestToken", verify.Token);
                
                _pollCts?.Cancel();
                CurrentState  = PaymentState.Success;
                StatusMessage = AppStrings.Get("pay_success_title");
            }
            else if (verify?.Status == "FAILED")
            {
                _pollCts?.Cancel();
                CurrentState  = PaymentState.Failed;
                StatusMessage = AppStrings.Get("pay_failed");
            }
            else
            {
                StatusMessage = "Chưa nhận được thanh toán. Vui lòng đợi thêm.";
            }
        });

        RetryCommand = new Command(async () =>
        {
            _pollCts?.Cancel();
            TransactionId   = "";
            TransferContent = "";
            VietQrUrl       = "";
            SecondsElapsed  = 0;
            StatusMessage   = "";
            await DoInitPaymentAsync();
        });

        EnterAppCommand = new Command(async () => await NavigateToApp());
    }

    // ── Init payment ──────────────────────────────────────────────────────────
    private async Task DoInitPaymentAsync()
    {
        IsBusy = true;

        var deviceId = await GetOrCreateDeviceId();
        var result   = await _api.InitTouristPaymentAsync(deviceId);

        if (result is null)
        {
            IsBusy = false;
            await ShowAlert("Lỗi kết nối", "Không thể kết nối server. Vui lòng thử lại.");
            return;
        }

        // Populate binding data
        TransactionId   = result.TransactionId;
        Amount          = result.Amount;
        TransferContent = result.TransferContent;
        VietQrUrl       = result.VietQrUrl;
        BankInfo        = $"{result.BankName} • {result.BankAccount}";
        StatusMessage   = AppStrings.Get("pay_waiting");
        SecondsElapsed  = 0;

        IsBusy       = false;
        CurrentState = PaymentState.Waiting;

        // Bắt đầu polling
        StartPolling(deviceId);
    }

    // ── Poll loop ─────────────────────────────────────────────────────────────
    private void StartPolling(string deviceId)
    {
        _pollCts = new CancellationTokenSource(TimeSpan.FromMinutes(15));
        var ct   = _pollCts.Token;

        Task.Run(async () =>
        {
            bool isResolved = false;

            while (!ct.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(5000, ct);
                    SecondsElapsed += 5;

                    var verify = await _api.VerifyTouristPaymentAsync(TransactionId, deviceId, ct);
                    if (verify is null) continue; // network error — thử lại

                    if (verify.Status == "SUCCESS")
                    {
                        // Lưu JWT
                        if (!string.IsNullOrEmpty(verify.Token))
                            await SecureStorage.SetAsync("GuestToken", verify.Token);

                        MainThread.BeginInvokeOnMainThread(() =>
                        {
                            CurrentState  = PaymentState.Success;
                            StatusMessage = AppStrings.Get("pay_success_title");
                        });
                        isResolved = true;
                        break;
                    }

                    if (verify.Status == "FAILED")
                    {
                        MainThread.BeginInvokeOnMainThread(() =>
                        {
                            CurrentState  = PaymentState.Failed;
                            StatusMessage = AppStrings.Get("pay_failed");
                        });
                        isResolved = true;
                        break;
                    }

                    // PENDING — tiếp tục poll (SecondsElapsed cập nhật qua setter)
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    #if DEBUG
                    System.Diagnostics.Debug.WriteLine($"[TouristPaymentVM] Poll error: {ex.Message}");
                    #endif
                }
            }

            // Timeout 15 phút
            if (!ct.IsCancellationRequested && !isResolved)
            {
                MainThread.BeginInvokeOnMainThread(() =>
                {
                    CurrentState  = PaymentState.Failed;
                    StatusMessage = AppStrings.Get("pay_timeout");
                });
            }
        }, CancellationToken.None);
    }

    // ── Navigate vào app sau khi thành công ──────────────────────────────────
    private async Task NavigateToApp()
    {
        App.MarkSessionValid();
        var services = IPlatformApplication.Current!.Services;
        var shell    = services.GetRequiredService<AppShell>();
        Application.Current!.MainPage = shell;
        await Task.CompletedTask;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private static async Task<string> GetOrCreateDeviceId()
    {
        var id = await SecureStorage.GetAsync("AppDeviceId");
        if (!string.IsNullOrEmpty(id)) return id;

        var raw = $"{DeviceInfo.Current.Name}_{DeviceInfo.Current.Model}_{DeviceInfo.Current.Manufacturer}_{DeviceInfo.Current.Platform}";
        id = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(raw)))[..16];
        await SecureStorage.SetAsync("AppDeviceId", id);
        return id;
    }

    private static Task ShowAlert(string title, string msg) =>
        MainThread.InvokeOnMainThreadAsync(() =>
            Application.Current?.MainPage?.DisplayAlert(title, msg, "OK") ?? Task.CompletedTask);
}
