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

    private async void OnSkipClicked(object sender, EventArgs e)
    {
        // Hiện màn hình loading overlay
        LoadingOverlay.IsVisible = true;

        // Đợi 1 chút xíu để UI kịp gọi render LoadingOverlay lên màn hình
        await Task.Delay(2000);

        // Đổi Root Page sang AppShell để truy cập app luôn (giả lập đã quét xong)
        Application.Current.MainPage = new AppShell();


        // Preload các tab (Map, Search) rồi về lại Home để khi user bấm sẽ mượt mà không bị khựng
        await Shell.Current.GoToAsync("//Map", animate: false);
        await Shell.Current.GoToAsync("//Search", animate: false);
        await Shell.Current.GoToAsync("//Home", animate: false);
    }
}
