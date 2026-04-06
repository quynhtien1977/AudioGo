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

    // Property wrapper để map MainMap → MapControl
    private Microsoft.Maui.Controls.Maps.Map MapControl => MainMap;

    public MapPage(MapViewModel vm, MainViewModel main)
    {
        InitializeComponent();
        _vm = vm;
        _main = main;
        BindingContext = vm;
    }

    protected override async void OnAppearing()
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

        // Yêu cầu vị trí hiện tại để căn giữa bản đồ
        await RequestInitialLocationAsync();
    }

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
        // BannerDesc.Text     = poi.Description ?? string.Empty; // Removed from XAML
        // BannerDistance.Text = _vm.SelectedPoiDistanceLabel; // Removed from XAML
        // BannerCategory.Text = (poi.Categories?.FirstOrDefault()) ?? string.Empty; // Removed from XAML
        // BannerImage.Source  = poi.LogoUrl; // Removed from XAML

        // Fade in
        await ShowPoiBannerAsync();
    }

    private async Task ShowPoiBannerAsync()
    {
        PoiBanner.IsVisible = true;
        await PoiBanner.FadeTo(1, 200, Easing.CubicOut);
    }

    private async Task HidePoiBannerAsync()
    {
        await PoiBanner.FadeTo(0, 150, Easing.CubicIn);
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
            await DisplayAlert("Lỗi", $"Không thể mở bản đồ: {ex.Message}", "OK");
        }
    }

    private async void OnQrScanClicked(object? sender, EventArgs e)
    {
        // TODO: QrScanPage không tồn tại
        // await Shell.Current.GoToAsync(nameof(QrScanPage));
    }

    private async void OnLanguageClicked(object? sender, EventArgs e)
    {
        var selected = await DisplayActionSheet(
            "Chọn ngôn ngữ thuyết minh",
            "Huỷ",
            null,
            "🇻🇳 Tiếng Việt",
            "🇬🇧 English",
            "🇨🇳 中文",
            "🇰🇷 한국어",
            "🇯🇵 日本語");

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
            _main.CurrentLanguage = lang;
            // Pins sẽ refresh sau khi ReloadPoisAsync hoàn tất
            _main.PropertyChanged += OnPoisReloaded;
        }
    }

    private void OnPoisReloaded(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName != nameof(MainViewModel.Pois)) return;
        _main.PropertyChanged -= OnPoisReloaded;
        MainThread.BeginInvokeOnMainThread(() =>
        {
            _vm.LoadPois(_main.Pois);
            RefreshPins();
        });
    }

    private void OnMiniPlayClicked(object? sender, EventArgs e)
    {
        if (_activePinPoiId is null) return;
        // Toggle play/pause từ banner — delegate xuống MainViewModel
        var poi = _main.ActivePoi;
        if (poi is not null)
            _ = _main.TriggerAudioAsync(poi);
    }

    private async Task RequestInitialLocationAsync()
    {
        try
        {
            var loc = await Geolocation.Default.GetLastKnownLocationAsync();
            if (loc is not null)
            {
                _vm.MoveTo(loc.Latitude, loc.Longitude);
                MainThread.BeginInvokeOnMainThread(() =>
                {
                    try
                    {
                        MapControl.MoveToRegion(MapSpan.FromCenterAndRadius(
                            new Location(loc.Latitude, loc.Longitude),
                            Distance.FromKilometers(1)));
                    }
                    catch { /* Map chưa sẵn sàng */ }
                });
            }
        }
        catch { /* GPS không khả dụng — bản đồ ở vị trí mặc định */ }
    }
}
