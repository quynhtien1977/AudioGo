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
        await Navigation.PushAsync(new WelcomeQrScanPage(new ViewModels.WelcomeQrScanViewModel()));
    }

    private void OnSkipClicked(object sender, EventArgs e)
    {
        // Đổi Root Page sang AppShell để truy cập app luôn (giả lập đã quét xong)
        Application.Current.MainPage = new AppShell();
    }
}
