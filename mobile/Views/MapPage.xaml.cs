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

        // Theo dõi POI active để hiển thị banner
        _main.PropertyChanged += OnMainPropertyChanged;
        _vm.PropertyChanged += OnVmPropertyChanged;

        // Yêu cầu vị trí hiện tại để căn giữa bản đồ
        await RequestInitialLocationAsync();
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        _main.PropertyChanged -= OnMainPropertyChanged;
        _vm.PropertyChanged -= OnVmPropertyChanged;
    }

    private void RefreshPins()
    {
        MapControl.Pins.Clear();
        foreach (var pin in _vm.Pins)
        {
            pin.MarkerClicked += OnPinMarkerClicked;
            MapControl.Pins.Add(pin);
        }
    }

    private async void OnPinMarkerClicked(object? sender, PinClickedEventArgs e)
    {
        if (sender is Pin pin && pin.BindingContext is string poiId)
        {
            e.HideInfoWindow = false;
            _activePinPoiId = poiId;
        }
        await Task.CompletedTask;
    }

    private void OnMainPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName != nameof(MainViewModel.ActivePoi)) return;

        MainThread.BeginInvokeOnMainThread(() =>
        {
            var poi = _main.ActivePoi;
            if (poi is null)
            {
                ActivePoiBanner.IsVisible = false;
                return;
            }
            ActivePoiTitle.Text = poi.Title;
            ActivePoiDesc.Text = poi.Description;
            _activePinPoiId = poi.PoiId;
            ActivePoiBanner.IsVisible = true;
        });
    }

    private void OnVmPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName != nameof(MapViewModel.VisibleRegion)) return;
        if (_vm.VisibleRegion is { } region)
            MapControl.MoveToRegion(region);
    }

    private async void OnPoiBannerDetailClicked(object? sender, EventArgs e)
    {
        if (_activePinPoiId is null) return;
        await Shell.Current.GoToAsync($"{nameof(PoiDetailPage)}?poiId={_activePinPoiId}");
    }

    private async void OnQrScanClicked(object? sender, EventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(QrScanPage));
    }

    private async Task RequestInitialLocationAsync()
    {
        try
        {
            var loc = await Geolocation.Default.GetLastKnownLocationAsync();
            if (loc is not null)
            {
                _vm.MoveTo(loc.Latitude, loc.Longitude);
                MapControl.MoveToRegion(MapSpan.FromCenterAndRadius(
                    new Location(loc.Latitude, loc.Longitude),
                    Distance.FromKilometers(1)));
            }
        }
        catch { /* GPS không khả dụng — bản đồ ở vị trí mặc định */ }
    }
}
