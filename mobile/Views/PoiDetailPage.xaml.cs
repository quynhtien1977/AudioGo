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
        => _ = _vm.StopAudioAsync();

    private void OnNextTapped(object? sender, TappedEventArgs e)
        => _ = _vm.PlayAudioAsync();

    private void OnSpeedTapped(object? sender, TappedEventArgs e)
        => _vm.CycleSpeed();

    private void OnSliderDragCompleted(object? sender, EventArgs e)
    {
        // Seek: plugin does not expose seek, skip silently
    }

    private void OnExpandDescTapped(object? sender, TappedEventArgs e)
        => _vm.ToggleDescExpanded();

    private async void OnNextPoiClicked(object? sender, EventArgs e)
        => await Shell.Current.GoToAsync("..");

    private async void OnGalleryFullScreenTapped(object? sender, TappedEventArgs e)
    {
        var images = _vm.GalleryImages;
        if (images is null || images.Count == 0) return;

        // CommandParameter chứa URL ảnh được tap — tìm index tương ứng
        int startIndex = 0;
        if (e.Parameter is string tappedUrl)
            startIndex = images.IndexOf(tappedUrl);
        if (startIndex < 0) startIndex = 0;

        var page = new GalleryFullScreenPage(images, startIndex);
        await Navigation.PushModalAsync(page, animated: true);
    }
}
