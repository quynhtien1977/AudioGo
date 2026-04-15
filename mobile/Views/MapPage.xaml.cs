using AudioGo.ViewModels;
using Microsoft.Maui.Controls.Maps;
using Microsoft.Maui.Maps;
using Shared;

namespace AudioGo_Mobile.Views;

public partial class MapPage : ContentPage
{
    private readonly MapViewModel _vm;
    private readonly MainViewModel _main;
    private string? _activePinPoiId;
    private bool _isSubscribed;

    // Expose Main for XAML bindings (MiniPlayer)
    public MainViewModel Main => _main;

    // Property wrapper để map MainMap → MapControl
    private Microsoft.Maui.Controls.Maps.Map MapControl => MainMap;

    public MapPage(MapViewModel vm, MainViewModel main)
    {
        InitializeComponent();
        _vm = vm;
        _main = main;
        BindingContext = vm;
        MiniPlayerGrid.BindingContext = _main;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();

        // Load pins từ danh sách POI hiện tại
        _vm.LoadPois(_main.Pois);
        RefreshPins();

        // Subscribe to map clicks to dismiss banner
        if (!_isSubscribed)
        {
            MapControl.MapClicked += OnMapClicked;
            _main.PropertyChanged += OnMainPropertyChanged;
            _vm.PropertyChanged += OnVmPropertyChanged;
            _isSubscribed = true;
        }
    }

        // Location sẽ được cập nhật tự động qua MapViewModel (lắng nghe ILocationService)
        // tránh gọi trực tiếp RequestInitialLocationAsync() lúc load page để không xung đột với MainViewModel.

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        MapControl.MapClicked -= OnMapClicked;
        _main.PropertyChanged -= OnMainPropertyChanged;
        _vm.PropertyChanged -= OnVmPropertyChanged;
        _isSubscribed = false;
    }

    private void OnMapClicked(object? sender, MapClickedEventArgs e)
        => _ = HidePoiBannerAsync();

    private void RefreshPins()
    {
        MapControl.Pins.Clear();
        foreach (var pin in _vm.Pins)
        {
            pin.MarkerClicked += OnPinMarkerClicked;
            MapControl.Pins.Add(pin);
        }
        RefreshGeofenceOverlays();
    }

    /// <summary>Xóa polygons cũ, thêm lại từ GeofencePolygons của VM.</summary>
    private void RefreshGeofenceOverlays()
    {
        // Remove old geofence polygons (keep other map elements)
        var toRemove = MapControl.MapElements
            .OfType<Polygon>()
            .ToList();
        foreach (var poly in toRemove)
            MapControl.MapElements.Remove(poly);

        foreach (var poly in _vm.GeofencePolygons)
            MapControl.MapElements.Add(poly);
    }

    private async void OnPinMarkerClicked(object? sender, PinClickedEventArgs e)
    {
        e.HideInfoWindow = true; // suppress default callout — we show our banner

        if (sender is not Pin pin || pin.BindingContext is not string poiId) return;
        _activePinPoiId = poiId;

        // Căn giữa map vào POI được chọn
        MapControl.MoveToRegion(MapSpan.FromCenterAndRadius(pin.Location, Distance.FromMeters(200)));

        var poi = _main.Pois.FirstOrDefault(p => p.PoiId == poiId);
        if (poi is null) return;

        // Update VM selected POI (for distance label etc.)
        _vm.SelectedPoi = poi;

        // Populate banner labels
        BannerTitle.Text    = poi.Title ?? string.Empty;
        BannerLang.Text     = poi.LanguageCode.ToUpper();
        BannerTime.Text     = _vm.TravelTimeLabel;
        BannerLogo.Source   = poi.LogoUrl;

        // Fade in
        await ShowPoiBannerAsync();
    }

    private async Task ShowPoiBannerAsync()
    {
        PoiBanner.IsVisible = true;
        await PoiBanner.FadeToAsync(1, 200, Easing.CubicOut);
    }

    private async Task HidePoiBannerAsync()
    {
        await PoiBanner.FadeToAsync(0, 150, Easing.CubicIn);
        PoiBanner.IsVisible = false;
        _vm.SelectedPoi = null;
        _activePinPoiId = null;
    }

    private void OnPoiBannerPlayClicked(object? sender, TappedEventArgs e)
    {
        if (_activePinPoiId is null) return;
        var poi = _main.Pois.FirstOrDefault(p => p.PoiId == _activePinPoiId);
        if (poi is null) return;
        _ = _main.TriggerAudioAsync(poi); // TriggerAudioAsync sets ActivePoi internally
    }

    private void OnLocateMeTapped(object? sender, TappedEventArgs e)
        => _vm.CenterOnUser();

    // ── Property Change Handlers ─────────────────────────────────────

    private void OnMainPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName != nameof(MainViewModel.ActivePoi)) return;

        MainThread.BeginInvokeOnMainThread(() =>
        {
            var poi = _main.ActivePoi;
            if (poi is null)
            {
                _ = HidePoiBannerAsync();
                return;
            }
            _activePinPoiId = poi.PoiId;
        });
    }

    private void OnVmPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(MapViewModel.VisibleRegion))
        {
            if (_vm.VisibleRegion is { } region)
                MainThread.BeginInvokeOnMainThread(() =>
                {
                    try { MapControl.MoveToRegion(region); }
                    catch { /* Map chưa sẵn sàng — bỏ qua */ }
                });
        }
        else if (e.PropertyName == nameof(MapViewModel.GeofencePolygons))
        {
            MainThread.BeginInvokeOnMainThread(RefreshGeofenceOverlays);
        }
    }

    private async void OnPoiBannerDetailClicked(object? sender, EventArgs e)
    {
        if (_activePinPoiId is null) return;
        await Shell.Current.GoToAsync($"{nameof(PoiDetailPage)}?poiId={_activePinPoiId}");
    }

    private async void OnBannerDirectionsTapped(object? sender, EventArgs e)
    {
        var poi = _vm.SelectedPoi;
        if (poi is null) return;

        try
        {
            var mapLocation = new Location(poi.Latitude, poi.Longitude);
            var options = new MapLaunchOptions { Name = poi.Title };
            await Microsoft.Maui.ApplicationModel.Map.Default.OpenAsync(mapLocation, options);
        }
        catch (Exception ex)
        {
            await DisplayAlertAsync("Lỗi", $"Không thể mở bản đồ: {ex.Message}", "OK");
        }
    }


    private async void OnLanguageClicked(object? sender, EventArgs e)
    {
        var selected = await DisplayActionSheetAsync(
            "Chọn ngôn ngữ thuyết minh",
            "Huỷ",
            null,
            "🇻🇳 Tiếng Việt",
            "🇬🇧 English",
            "🇨🇳 中文",
            "🇯🇵 日本語",
            "🇰🇷 한국어");

        var lang = selected switch
        {
            "🇻🇳 Tiếng Việt" => "vi",
            "🇬🇧 English"    => "en",
            "🇨🇳 中文"        => "zh-Hans",
            "🇰🇷 한국어"       => "ko",
            "🇯🇵 日本語"       => "ja",
            _ => null
        };

        if (lang is not null)
        {
            await _main.ChangeLanguageAsync(lang);
            _vm.LoadPois(_main.Pois);
            RefreshPins();
        }
    }
    private void OnMiniPlayClicked(object? sender, EventArgs e)
    {
        _main.ToggleAudio();
    }

    private void OnMiniPlayerCloseTapped(object? sender, TappedEventArgs e)
    {
        _main.StopAudio();
    }

}
