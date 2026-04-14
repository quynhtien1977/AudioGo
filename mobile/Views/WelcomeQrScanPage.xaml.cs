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

    private async void OnPickPhotoTapped(object sender, EventArgs e)
    {
        try
        {
            var photo = await MediaPicker.PickPhotoAsync();
            if (photo == null || !_viewModel.IsDetecting) return;

            _viewModel.IsDetecting = false;
            barcodeReader.IsScanning = false;
            _viewModel.IsLoading = true;

            var stream = await photo.OpenReadAsync();
            string resultText = null;

#if ANDROID
            var bmp = Android.Graphics.BitmapFactory.DecodeStream(stream);
            if (bmp != null)
            {
                int width = bmp.Width;
                int height = bmp.Height;
                int[] pixels = new int[width * height];
                bmp.GetPixels(pixels, 0, width, 0, 0, width, height);

                var luminance = new byte[width * height];
                for (int i = 0; i < pixels.Length; i++)
                {
                    int c = pixels[i];
                    int r = (c >> 16) & 0xff;
                    int g = (c >> 8) & 0xff;
                    int b = c & 0xff;
                    luminance[i] = (byte)((r + g + b) / 3);
                }
                
                var source = new ZXing.PlanarYUVLuminanceSource(luminance, width, height, 0, 0, width, height, false);
                var reader = new ZXing.BarcodeReaderGeneric();
                var result = reader.Decode(source);
                if (result != null)
                {
                    resultText = result.Text;
                }
                bmp.Recycle();
            }
#else
            await DisplayAlert("Thông báo", "Chức năng quét ảnh hiện chỉ hỗ trợ trên Android.", "OK");
#endif

            _viewModel.IsLoading = false;

            if (!string.IsNullOrEmpty(resultText))
            {
                if (_viewModel.ProcessBarcodeCommand.CanExecute(resultText))
                {
                    _viewModel.ProcessBarcodeCommand.Execute(resultText);
                }
            }
            else
            {
                await DisplayAlert("Lỗi", "Không tìm thấy mã QR hợp lệ trong ảnh.", "OK");
                _viewModel.IsDetecting = true;
                barcodeReader.IsScanning = true;
            }
        }
        catch (Exception ex)
        {
            _viewModel.IsLoading = false;
            _viewModel.IsDetecting = true;
            barcodeReader.IsScanning = true;
            await DisplayAlert("Lỗi", "Đã xảy ra lỗi: " + ex.Message, "OK");
        }
    }
}
