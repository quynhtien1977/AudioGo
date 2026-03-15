using AudioGo.ViewModels;

namespace AudioGo_Mobile.Views;

public partial class PoiDetailPage : ContentPage
{
    private readonly PoiDetailViewModel _vm;

    public PoiDetailPage(PoiDetailViewModel vm)
    {
        InitializeComponent();
        _vm = vm;
        BindingContext = vm;
    }

    private async void OnPlayClicked(object? sender, EventArgs e)
    {
        await _vm.PlayAudioAsync();
    }

    private async void OnStopClicked(object? sender, EventArgs e)
    {
        await _vm.StopAudioAsync();
    }
}
