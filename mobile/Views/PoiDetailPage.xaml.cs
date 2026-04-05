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
        // Sync audio UI state — audio may be running from the MainPage mini-player
        _vm.RefreshAudioState();
    }

    private async void OnBackTapped(object? sender, TappedEventArgs e)
        => await Shell.Current.GoToAsync("..");

    private async void OnPlayPauseTapped(object? sender, TappedEventArgs e)
        => await _vm.TogglePlayPauseAsync();

    // ── Skip buttons: prev/next just stop/restart (seek not supported by plugin) ──
    private async void OnPreviousTapped(object? sender, TappedEventArgs e)
        => await _vm.StopAudioAsync();

    private async void OnNextTapped(object? sender, TappedEventArgs e)
        => await _vm.PlayAudioAsync();

    private void OnSpeedTapped(object? sender, TappedEventArgs e)
        => _vm.CycleSpeed();

    private void OnSliderDragCompleted(object? sender, EventArgs e)
    {
        // Seek not supported by plugin — no-op
    }

    /// <summary>
    /// Fires when the SeekContainer Grid is measured so we can tell the VM
    /// the rendered width to position the thumb ellipse correctly.
    /// </summary>
    private void OnSeekbarSizeChanged(object? sender, EventArgs e)
    {
        if (sender is View v && v.Width > 0)
            _vm.SeekbarWidth = v.Width;
    }

    private void OnExpandDescTapped(object? sender, TappedEventArgs e)
        => _vm.ToggleDescExpanded();

    private async void OnGalleryFullScreenTapped(object? sender, TappedEventArgs e)
    {
        var images = _vm.GalleryImages;
        if (images is null || images.Count == 0) return;

        int startIndex = 0;
        if (e.Parameter is string tappedUrl)
            startIndex = images.IndexOf(tappedUrl);
        if (startIndex < 0) startIndex = 0;

        var page = new GalleryFullScreenPage(images, startIndex);
        await Navigation.PushModalAsync(page, animated: true);
    }
}
