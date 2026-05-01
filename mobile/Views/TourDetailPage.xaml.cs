using AudioGo.ViewModels;
using AudioGo_Mobile.Helpers;
using Microsoft.Maui.Controls.Maps;
using Microsoft.Maui.Maps;

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
        await _vm.LoadAsync(_vm.TourId ?? string.Empty);
        PopulateMiniMap();
    }

    // ── Mini Map ────────────────────────────────────────────────────
    /// <summary>Populate mini map với numbered pins của từng POI trong tour.</summary>
    private void PopulateMiniMap()
    {
        MiniMap.Pins.Clear();
        var stops = _vm.Stops.OrderBy(s => s.StepOrder).ToList();

        foreach (var stop in stops)
        {
            if (stop.Latitude == 0 && stop.Longitude == 0) continue;
            MiniMap.Pins.Add(new Pin
            {
                Label    = stop.StepNumber,   // "1", "2", "3"...
                Location = new Location(stop.Latitude, stop.Longitude),
                Type     = PinType.Place,
            });
        }

        // Auto-zoom vừa tất cả pins
        var validStops = stops.Where(s => s.Latitude != 0 || s.Longitude != 0).ToList();
        if (!validStops.Any()) return;

        var centerLat = validStops.Average(s => s.Latitude);
        var centerLon = validStops.Average(s => s.Longitude);
        var latSpan   = validStops.Max(s => s.Latitude) - validStops.Min(s => s.Latitude) + 0.005;
        var lonSpan   = validStops.Max(s => s.Longitude) - validStops.Min(s => s.Longitude) + 0.005;

        try
        {
            MiniMap.MoveToRegion(new MapSpan(
                new Location(centerLat, centerLon),
                Math.Max(latSpan, 0.005),
                Math.Max(lonSpan, 0.005)));
        }
        catch
        {
            // Map chưa sẵn sàng — bỏ qua, không crash
        }
    }

    // ── Navigation handlers ─────────────────────────────────────────
    private async void OnBackTapped(object? sender, TappedEventArgs e)
        => await Shell.Current.GoToAsync("..");

    private void OnContinueClicked(object? sender, EventArgs e)
        => _vm.TogglePlay();

    private async void OnMapClicked(object? sender, EventArgs e)
    {
        // Truyền danh sách PoiId qua static context (thay MessagingCenter)
        var poiIds = _vm.Stops.Select(s => s.PoiId).ToList();
        if (poiIds.Count > 0)
            TourMapContext.PendingTourPoiIds = poiIds;

        await Shell.Current.GoToAsync("//Map");
    }

    private void OnPlayPauseTapped(object? sender, TappedEventArgs e)
        => _vm.TogglePlay();

    private void OnNextStopTapped(object? sender, TappedEventArgs e)
        => _vm.Stop();
}
