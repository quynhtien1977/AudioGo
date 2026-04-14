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

        // Keep the red fill BoxView width in sync with the thumb position
        // We hook PropertyChanged here instead of a converter to avoid a
        // full IValueConverter dependency on SeekbarWidth.
        vm.PropertyChanged += (_, e) =>
        {
            if (e.PropertyName is nameof(vm.ThumbOffsetX) or nameof(vm.SeekbarWidth))
            {
                // The fill ends at the centre of the thumb
                SeekFill.WidthRequest = Math.Max(0, vm.ThumbOffsetX + 7);
            }
        };
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        // Đồng bộ hóa việc subscribe UI event cùng với lifecycle của Page để đảm bảo nhất quán
        _vm.SubscribeEvents();
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        // Stop 60fps progress timer khi rời trang — tránh memory/CPU leak
        // PoiDetailViewModel là Transient nên finalizer không chạy kịp thời
        _vm.Cleanup();
    }

    private async void OnBackTapped(object? sender, TappedEventArgs e)
        => await Shell.Current.GoToAsync("..");

    private async void OnPlayPauseTapped(object? sender, TappedEventArgs e)
        => await _vm.TogglePlayPauseAsync();

    // Skip back = restart from beginning (seek not supported by plugin)
    private async void OnPreviousTapped(object? sender, TappedEventArgs e)
        => await _vm.StopAudioAsync();

    // Skip forward = play next / replay
    private async void OnNextTapped(object? sender, TappedEventArgs e)
        => await _vm.PlayAudioAsync();

    private void OnSpeed075Tapped(object? sender, TappedEventArgs e) => _vm.SelectSpeed(0);
    private void OnSpeed1xTapped(object? sender, TappedEventArgs e)  => _vm.SelectSpeed(1);
    private void OnSpeed125Tapped(object? sender, TappedEventArgs e) => _vm.SelectSpeed(2);
    private void OnSpeed15Tapped(object? sender, TappedEventArgs e)  => _vm.SelectSpeed(3);

    private void OnSliderDragStarted(object? sender, EventArgs e)
        => _vm.BeginSeek();

    private async void OnSliderDragCompleted(object? sender, EventArgs e)
    {
        if (sender is Slider s)
            await _vm.SeekToAsync(s.Value);
    }

    /// <summary>
    /// Fires when the invisible Slider is measured so we can tell the VM
    /// the rendered width for pixel-accurate thumb positioning.
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
