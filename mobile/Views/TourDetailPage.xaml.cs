using AudioGo.ViewModels;

namespace AudioGo_Mobile.Views;

public partial class TourDetailPage : ContentPage
{
    private readonly TourDetailViewModel _vm;

    public TourDetailPage(TourDetailViewModel vm)
    {
        InitializeComponent();
        _vm = vm;
        BindingContext = vm;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        // TourId may be set via QueryProperty; load with empty string to use whatever is set
        await _vm.LoadAsync(_vm.TourId ?? string.Empty);
    }

    private async void OnBackTapped(object? sender, TappedEventArgs e)
        => await Shell.Current.GoToAsync("..");

    private void OnContinueClicked(object? sender, EventArgs e)
        => _vm.TogglePlay();

    private async void OnMapClicked(object? sender, EventArgs e)
        => await Shell.Current.GoToAsync("//Map");

    private void OnPlayPauseTapped(object? sender, TappedEventArgs e)
        => _vm.TogglePlay();

    private void OnNextStopTapped(object? sender, TappedEventArgs e)
        => _vm.Stop();
}
