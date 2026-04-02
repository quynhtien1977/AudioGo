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

    protected override void OnAppearing()
    {
        base.OnAppearing();
        // PoiId is set via QueryProperty; LoadAsync is called automatically
    }

    private async void OnBackTapped(object? sender, TappedEventArgs e)
        => await Shell.Current.GoToAsync("..");

    private async void OnPlayPauseTapped(object? sender, TappedEventArgs e)
        => await _vm.TogglePlayPauseAsync();

    private void OnPreviousTapped(object? sender, TappedEventArgs e)
    {
        // Previous stop handled by TourDetailVM; here it stops audio
        _ = _vm.StopAudioAsync();
    }

    private void OnNextTapped(object? sender, TappedEventArgs e)
        => _ = _vm.PlayAudioAsync();

    private void OnSpeedTapped(object? sender, TappedEventArgs e)
    {
        // Speed cycling: UI-only for now
    }

    private void OnSliderDragCompleted(object? sender, EventArgs e)
    {
        // Seek: plugin does not expose seek, skip silently
    }

    private void OnExpandDescTapped(object? sender, TappedEventArgs e)
    {
        // Toggle description expanded state via VM property if available
    }

    private async void OnNextPoiClicked(object? sender, EventArgs e)
        => await Shell.Current.GoToAsync("..");
}
