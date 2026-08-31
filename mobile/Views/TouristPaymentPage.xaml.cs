using AudioGo_Mobile.ViewModels;
using Microsoft.Maui.Controls;

namespace AudioGo_Mobile.Views;

public partial class TouristPaymentPage : ContentPage
{
    private readonly TouristPaymentViewModel _vm;

    public TouristPaymentPage(TouristPaymentViewModel vm)
    {
        InitializeComponent();
        _vm = vm;
        BindingContext = vm;
    }

    private void OnBackTapped(object sender, EventArgs e)
    {
        // Cancel polling rồi pop — dùng Navigation của page này (NavigationPage stack),
        // không dùng Shell.Current vì chưa vào app shell.
        _vm.CancelPolling();
        _ = Navigation.PopAsync();
    }

    /// <summary>
    /// Override nút back vật lý Android — càng cancel polling trước khi pop.
    /// </summary>
    protected override bool OnBackButtonPressed()
    {
        _vm.CancelPolling();
        _ = Navigation.PopAsync();
        return true; // true = đã xử lý, không dùng default behavior
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        if (_vm.CurrentState == PaymentState.Initializing && !_vm.IsBusy)
        {
            _vm.InitPaymentCommand.Execute(null);
        }
    }
}
