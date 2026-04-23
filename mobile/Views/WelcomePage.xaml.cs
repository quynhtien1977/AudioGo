using Microsoft.Maui.Controls;

namespace AudioGo_Mobile.Views;

public partial class WelcomePage : ContentPage
{
    public WelcomePage()
    {
        InitializeComponent();
    }

    private async void OnScanQrClicked(object sender, EventArgs e)
    {
        // Điều hướng sang trang quét QR (Push vào stack của NavigationPage)
        var scanPage = (WelcomeQrScanPage)Handler.MauiContext.Services.GetService(typeof(WelcomeQrScanPage));
        await Navigation.PushAsync(scanPage);
    }

    private double _sheetTranslationY;

    private void OnBottomSheetPanUpdated(object sender, PanUpdatedEventArgs e)
    {
        switch (e.StatusType)
        {
            case GestureStatus.Running:
                // Kéo xuống -> TranslationY tăng (dương)
                // Kéo lên -> TranslationY giảm (âm). Ta giới hạn không cho kéo lên quá vị trí ban đầu (TranslationY = 0)
                var targetY = _sheetTranslationY + e.TotalY;
                if (targetY > 0)
                {
                    BottomSheetBorder.TranslationY = targetY;
                }
                else
                {
                    BottomSheetBorder.TranslationY = 0;
                }
                break;

            case GestureStatus.Completed:
                _sheetTranslationY = BottomSheetBorder.TranslationY;
                
                // Nếu kéo xuống quá 100px, thu nhỏ một chút và nảy lại
                if (_sheetTranslationY > 100)
                {
                    BottomSheetBorder.TranslateTo(0, 0, 300, Easing.SpringOut);
                    _sheetTranslationY = 0;
                }
                else
                {
                    BottomSheetBorder.TranslateTo(0, 0, 250, Easing.CubicOut);
                    _sheetTranslationY = 0;
                }
                break;
        }
    }
}
