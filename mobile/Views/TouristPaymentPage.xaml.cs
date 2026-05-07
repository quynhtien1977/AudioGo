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

    private async void OnBackTapped(object sender, EventArgs e)
    {
        // Hủy poll nếu đang chờ
        _vm.CancelCommand.Execute(null);
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
