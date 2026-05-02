using AudioGo.Controls;
using AudioGo.ViewModels;
using AudioGo_Mobile.Helpers;
using Microsoft.Maui.Controls.Maps;
using Microsoft.Maui.Maps;
using Shared;

namespace AudioGo_Mobile.Views;

public partial class TourDetailPage : ContentPage
{
    private readonly TourDetailViewModel _vm;
    private readonly MainViewModel       _main;

    public TourDetailPage(TourDetailViewModel vm, MainViewModel main)
    {
        InitializeComponent();
        _vm   = vm;
        _main = main;
        BindingContext = vm;

        // Mini player theo dõi trạng thái MainViewModel (singleton)
        _main.PropertyChanged += OnMainPropertyChanged;
    }

    // ── Lifecycle ────────────────────────────────────────────────────
    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.LoadAsync(_vm.TourId ?? string.Empty);
        PopulateMiniMap();
        SyncMiniPlayer();          // đồng bộ ngay nếu đang phát
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        // Không unsubscribe PropertyChanged vì mini player cần tiếp tục khi quay lại page
    }

    // ── MainViewModel property-change → cập nhật mini player ─────────
    private void OnMainPropertyChanged(object? sender,
        System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName is nameof(MainViewModel.HasActivePoi)
                           or nameof(MainViewModel.ActivePoi)
                           or nameof(MainViewModel.MiniPlayerPlayIcon)
                           or nameof(MainViewModel.IsAudioPlaying))
        {
            MainThread.BeginInvokeOnMainThread(SyncMiniPlayer);
        }
    }

    /// <summary>
    /// Đồng bộ UI mini player với trạng thái MainViewModel.
    /// Cùng logic/XAML structure với MapPage.xaml mini player → nhất quán.
    /// </summary>
    private void SyncMiniPlayer()
    {
        bool has = _main.HasActivePoi;
        MiniPlayerBorder.IsVisible = has;
        if (!has) return;

        var poi = _main.ActivePoi;
        MiniPlayerTitle.Text    = poi?.Title ?? string.Empty;
        MiniPlayerSub.Text      = _main.MiniPlayerNowPlaying;
        MiniPlayerPlayIcon.Text = _main.MiniPlayerPlayIcon;

        // Logo: dùng LocalLogoPath nếu có, fallback LogoUrl (cùng logic MapPage)
        string? logoSrc = null;
        if (poi is not null)
            logoSrc = (!string.IsNullOrEmpty(poi.LocalLogoPath) && File.Exists(poi.LocalLogoPath))
                      ? poi.LocalLogoPath
                      : poi.LogoUrl;

        MiniPlayerLogo.Source    = logoSrc;
        MiniPlayerLogo.IsVisible = !string.IsNullOrEmpty(logoSrc);
    }

    // ── Stop-card tap → play audio qua MainViewModel ─────────────────
    private async void OnStopCardTapped(object? sender, TappedEventArgs e)
    {
        if (e.Parameter is not TourStepVm stop) return;

        // Tìm POI trong danh sách Main (dùng lại object có đầy đủ LocalAudioPath/LogoUrl)
        var existingPoi = _main.Pois.FirstOrDefault(p => p.PoiId == stop.PoiId);

        if (existingPoi is not null)
        {
            // Toggle nếu đang phát cùng POI
            if (_main.ActivePoi?.PoiId == existingPoi.PoiId)
            {
                _main.ToggleAudio();
                return;
            }
            await _main.TriggerAudioAsync(existingPoi);
        }
        else if (!string.IsNullOrEmpty(stop.AudioUrl))
        {
            // POI chỉ có trong tour, không trong Pois cache → tạo minimal POI
            var poi = new POI
            {
                PoiId         = stop.PoiId,
                Title         = stop.Title,
                Description   = stop.Description,
                AudioUrl      = stop.AudioUrl,
                Latitude      = stop.Latitude,
                Longitude     = stop.Longitude,
                LanguageCode  = AudioGo.Helpers.AppSettings.GetAppLanguage(),
            };

            if (_main.ActivePoi?.PoiId == poi.PoiId)
            {
                _main.ToggleAudio();
                return;
            }
            await _main.TriggerAudioAsync(poi);
        }
    }

    // ── Mini player button handlers (giống MapPage) ───────────────────
    private void OnMiniPlayTapped(object? sender, TappedEventArgs e)
        => _main.ToggleAudio();

    private void OnMiniPlayerCloseTapped(object? sender, TappedEventArgs e)
    {
        _main.StopAudio();
        SyncMiniPlayer();
    }

    // ── Navigation ───────────────────────────────────────────────────
    private async void OnBackTapped(object? sender, TappedEventArgs e)
        => await Shell.Current.GoToAsync("..");

    private void OnContinueClicked(object? sender, EventArgs e)
        => _main.ToggleAudio();

    /// <summary>
    /// Tap mini map → mở MapPage với POI của tour này + route polyline.
    /// </summary>
    private async void OnMapBannerTapped(object? sender, TappedEventArgs e)
        => await OpenMapWithTourRoute();

    private async Task OpenMapWithTourRoute()
    {
        var stops = _vm.Stops.OrderBy(s => s.StepOrder).ToList();
        if (stops.Count > 0)
        {
            // Truyền danh sách PoiId để MapPage filter
            TourMapContext.PendingTourPoiIds = stops.Select(s => s.PoiId).ToList();

            // Truyền step orders để MapPage hiển thị số thứ tự
            TourMapContext.PendingTourStepOrders = stops.ToDictionary(
                s => s.PoiId, s => s.StepOrder);
        }
        await Shell.Current.GoToAsync("//Map");
    }

    // ── Mini Map: render pins + Polyline route ───────────────────────
    private void PopulateMiniMap()
    {
        MiniMap.Pins.Clear();
        MiniMap.MapElements.Clear();

        var stops = _vm.Stops.OrderBy(s => s.StepOrder).ToList();
        var valid = stops.Where(s => s.Latitude != 0 || s.Longitude != 0).ToList();
        if (valid.Count == 0) return;

        foreach (var stop in valid)
        {
            // CustomPin với số thứ tự — handler Android vẽ numbered circle pin
            MiniMap.Pins.Add(new CustomPin
            {
                Label      = stop.StepNumber,  // callout text (fallback)
                StepNumber = stop.StepOrder,    // trigger numbered rendering
                PoiId      = stop.PoiId,
                Location   = new Location(stop.Latitude, stop.Longitude),
                Type       = PinType.Place,
            });
        }

        // Route polyline màu Primary (#D15993)
        if (valid.Count >= 2)
        {
            var line = new Polyline
            {
                StrokeColor = Color.FromArgb("#D15993"),
                StrokeWidth = 4
            };
            foreach (var s in valid)
                line.Geopath.Add(new Location(s.Latitude, s.Longitude));
            MiniMap.MapElements.Add(line);
        }

        // Auto-zoom
        var cLat    = valid.Average(s => s.Latitude);
        var cLon    = valid.Average(s => s.Longitude);
        var latSpan = Math.Max(valid.Max(s => s.Latitude) - valid.Min(s => s.Latitude) + 0.008, 0.008);
        var lonSpan = Math.Max(valid.Max(s => s.Longitude) - valid.Min(s => s.Longitude) + 0.008, 0.008);

        try { MiniMap.MoveToRegion(new MapSpan(new Location(cLat, cLon), latSpan, lonSpan)); }
        catch { /* map not ready yet */ }
    }
}
