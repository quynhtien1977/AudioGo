using AudioGo_Mobile.ViewModels;
using Microsoft.Maui.Controls;
using BarcodeScanner.Mobile;

namespace AudioGo_Mobile.Views;

public partial class WelcomeQrScanPage : ContentPage
{
    private WelcomeQrScanViewModel _viewModel;

    public WelcomeQrScanPage(WelcomeQrScanViewModel viewModel)
    {
        InitializeComponent();
        BarcodeScanner.Mobile.Methods.SetSupportBarcodeFormat(BarcodeFormats.QRCode);
        _viewModel = viewModel;
        BindingContext = _viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        var status = await Permissions.CheckStatusAsync<Permissions.Camera>();
        if (status != PermissionStatus.Granted)
        {
            status = await Permissions.RequestAsync<Permissions.Camera>();
        }

        if (status == PermissionStatus.Granted)
        {
            _viewModel.IsDetecting = true;
            barcodeReader.IsScanning = true;
        }
        else
        {
            await this.DisplayAlertAsync("Lỗi", "Chưa cấp quyền Camera. Không thể quét mã QR.", "Đóng");
        }
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        _viewModel.IsDetecting = false;
        barcodeReader.IsScanning = false;
    }

    private void CameraBarcodeReaderView_BarcodesDetected(object sender, OnDetectedEventArg e)
    {
        var resultList = e.BarcodeResults;
        if (resultList == null || resultList.Count == 0 || !_viewModel.IsDetecting) return;

        MainThread.BeginInvokeOnMainThread(() =>
        {
            // Tránh quét lại trong lúc đang xử lý
            _viewModel.IsDetecting = false;
            barcodeReader.IsScanning = false;

            // Xử lý mã quét đầu tiên
            var firstVal = resultList[0].RawValue;
            if (_viewModel.ProcessBarcodeCommand.CanExecute(firstVal))
            {
                _viewModel.ProcessBarcodeCommand.Execute(firstVal);
            }
        });
    }

    private async void OnBackTapped(object sender, EventArgs e)
    {
        await Navigation.PopAsync();
    }
}
