using AudioGo.Services;
using AudioGo.Services.Interfaces;
using Microsoft.Maui.Controls.Maps;
using Microsoft.Maui.Maps;
using Shared;
using System.Collections.ObjectModel;
using System.Windows.Input;
using AudioGo.Helpers;

namespace AudioGo.ViewModels
{
    public class MapViewModel : BaseViewModel
    {
        private readonly ILocationService _location;
        private readonly SyncService _sync;
        private readonly IApiService _api;

        public ObservableCollection<AudioGo.Controls.CustomPin> Pins { get; } = new();
        public ObservableCollection<CategoryChipVm> CategoryChips { get; }
        public ICommand FilterCommand { get; }

        private string _activeCategory = string.Empty;
        private List<POI> _sourcePois = new();

        private MapSpan? _visibleRegion;
        public MapSpan? VisibleRegion
        {
            get => _visibleRegion;
            private set { SetProperty(ref _visibleRegion, value); }
        }

        private Location? _userLocation;
        public Location? UserLocation
        {
            get => _userLocation;
            private set { SetProperty(ref _userLocation, value); }
        }

        private POI? _selectedPoi;
        public POI? SelectedPoi
        {
            get => _selectedPoi;
            set
            {
                SetProperty(ref _selectedPoi, value);
                OnPropertyChanged(nameof(SelectedPoiDistanceLabel));
                OnPropertyChanged(nameof(TravelTimeLabel));
            }
        }

        /// <summary>Distance label for POI banner, e.g. "cÃ¡ch 150m".</summary>
        public string SelectedPoiDistanceLabel
        {
            get
            {
                if (_selectedPoi is null || _userLocation is null) return string.Empty;
                var dist = AudioGo.Helpers.GeoHelper.HaversineMeters(
                    _userLocation.Latitude, _userLocation.Longitude,
                    _selectedPoi.Latitude, _selectedPoi.Longitude);
                return dist < 1000
                    ? AppStrings.Get("map_distance_m", ((int)dist).ToString())
                    : AppStrings.Get("map_distance_km", (dist / 1000.0).ToString("F1"));
            }
        }

        public string TravelTimeLabel
        {
            get
            {
                if (_selectedPoi is null || _userLocation is null) return string.Empty;
                var dist = AudioGo.Helpers.GeoHelper.HaversineMeters(
                    _userLocation.Latitude, _userLocation.Longitude,
                    _selectedPoi.Latitude, _selectedPoi.Longitude);
                int minutes = (int)Math.Max(1, Math.Round(dist / 83.33)); // ~5km/h walking
                return AppStrings.Get("map_walk_time", minutes.ToString());
            }
        }

        public MapViewModel(ILocationService location, IApiService api, SyncService sync)
        {
            _location = location;
            _api = api;
            _sync = sync;
            _location.LocationUpdated += OnLocationUpdated;

            // Start with defaults while API loads
            CategoryChips = new ObservableCollection<CategoryChipVm>(
                CategoryChipVm.GetDefaultChips().Select(c => new CategoryChipVm(c.label, c.icon, c.value)));

            if (CategoryChips.Count > 0)
                CategoryChips[0].IsActive = true;

            FilterCommand = new Command<CategoryChipVm>(chip =>
            {
                if (chip is null) return;
                foreach (var c in CategoryChips) c.IsActive = false;
                chip.IsActive = true;
                _activeCategory = chip.Value;
                RefilterPins();
            });

            _ = LoadCategoriesAsync();
            _sync.LanguageChanged += OnLanguageChanged;
        }

        private void OnLanguageChanged(object? sender, string e)
        {
            OnPropertyChanged(nameof(MapTitle));
            OnPropertyChanged(nameof(MapListenLabel));
            OnPropertyChanged(nameof(MapDetailsLabel));
            OnPropertyChanged(nameof(MapDirectionsLabel));
            OnPropertyChanged(nameof(MapStatusLabel));
            OnPropertyChanged(nameof(SelectedPoiDistanceLabel));
            OnPropertyChanged(nameof(TravelTimeLabel));
            _ = LoadCategoriesAsync();
        }

        private async Task LoadCategoriesAsync()
        {
            try
            {
                var apiCategories = await _sync.GetCategoriesAsync();
                if (apiCategories.Count == 0) return;

                var lang = AudioGo.Helpers.AppSettings.GetAppLanguage();
                var newChips = CategoryChipVm.BuildFromApiCategories(apiCategories, lang);
                var currentActive = CategoryChips.FirstOrDefault(c => c.IsActive)?.Value ?? "";

                await MainThread.InvokeOnMainThreadAsync(() =>
                {
                    CategoryChips.Clear();
                    foreach (var chip in newChips)
                    {
                        if (chip.Value == currentActive) chip.IsActive = true;
                        CategoryChips.Add(chip);
                    }
                    if (!CategoryChips.Any(c => c.IsActive) && CategoryChips.Count > 0)
                        CategoryChips[0].IsActive = true;
                });
            }
            catch { /* keep defaults */ }
        }

        public void LoadPois(IEnumerable<POI> pois)
        {
            _sourcePois = pois.ToList();
            RefilterPins();

            // S3-3: Pre-warm icon cache ngay khi danh sách POI được load
            // Đảm bảo khi MapPage render lần đầu, cache đã sẵn sàng và không cần await
#if ANDROID
            var logoUrls = _sourcePois
                .Select(p => !string.IsNullOrEmpty(p.LocalLogoPath) && File.Exists(p.LocalLogoPath)
                    ? p.LocalLogoPath
                    : p.LogoUrl)
                .Where(u => !string.IsNullOrEmpty(u));
            _ = AudioGo.Platforms.Android.CustomMapPinHandler.PreloadIconsAsync(logoUrls);
#endif
        }

        private void RefilterPins()
        {
            Pins.Clear();
            foreach (var poi in _sourcePois)
            {
                if (!string.IsNullOrEmpty(_activeCategory))
                {
                    if (poi.Categories == null || !poi.Categories.Contains(_activeCategory))
                        continue;
                }

                if (poi.Latitude is 0 && poi.Longitude is 0) continue;
                if (poi.Latitude < -90 || poi.Latitude > 90) continue;
                if (poi.Longitude < -180 || poi.Longitude > 180) continue;

                try
                {
                    var pin = new AudioGo.Controls.CustomPin
                    {
                        Label = poi.Title ?? "Unknown",
                        Address = poi.Description ?? string.Empty,
                        Location = new Location(poi.Latitude, poi.Longitude),
                        Type = PinType.Place,
                        ImageUrl = (!string.IsNullOrEmpty(poi.LocalLogoPath) && File.Exists(poi.LocalLogoPath)) ? poi.LocalLogoPath : (poi.LogoUrl ?? string.Empty)
                    };
                    
                    pin.BindingContext = poi.PoiId;
                    Pins.Add(pin);
                }
                catch
                {
                    System.Diagnostics.Debug.WriteLine($"[MapVM] Failed to create pin for POI {poi.PoiId}");
                }
            }
            OnPropertyChanged(nameof(MapStatusLabel));
            // Geofence luôn sync với Pins — gọi sau khi Pins đã được build xong
            BuildGeofenceCircles();
        }

        // ─── Geofence overlays — differential update ─────────────────────────────
        //
        // Persistent caches: object sống suốt vòng đời của POI visible.
        // Khi POI không đổi → KHÔNG tạo object mới → không remove/add → không bị alpha bug.

        private readonly Dictionary<string, Polygon>        _fillByPoiId  = new();
        private readonly Dictionary<string, List<Polyline>> _linesByPoiId = new();

        /// <summary>Fill Polygons hiện đang active — flat list để MapPage đọc.</summary>
        public IReadOnlyList<Polygon>  GeofenceFills     => _fillByPoiId.Values.ToList();
        /// <summary>Dashed Polylines hiện đang active — flat list để MapPage đọc.</summary>
        public IReadOnlyList<Polyline> GeofencePolylines => _linesByPoiId.Values.SelectMany(s => s).ToList();

        private const double DegToRad = Math.PI / 180.0;
        private const double RadToDeg = 180.0 / Math.PI;
        private const int TotalSegments = 72;

        private static readonly Color BoundaryStrokeIdle   = Color.FromArgb("#BFEF4444");
        private static readonly Color BoundaryStrokeActive = Color.FromArgb("#FFEF4444");
        private const float BoundaryIdleWidth   = 2.5f;
        private const float BoundaryActiveWidth = 4.0f;
        // Fill màu cố định — KHÔNG BAO GIỜ thay đổi sau khi tạo
        private static readonly Color BoundaryFill = Color.FromArgb("#18EF4444");

        private int _geofenceSourceHash = -1;

        /// <summary>
        /// Tăng mỗi khi geofence thay đổi — MapPage subscribe để gọi RefreshGeofenceOverlays.
        /// </summary>
        public int GeofenceVersion { get; private set; }

        /// <summary>
        /// Differential rebuild: chỉ tạo/xóa object của POI thực sự thay đổi.
        /// POI giữ nguyên → object giữ nguyên trong MapElements → không bị alpha darkening.
        /// </summary>
        public void BuildGeofenceCircles()
        {
            const int dash = 8;
            const int gap  = 4;

            // Visible POI IDs (source of truth = Pins)
            var poiLookup  = _sourcePois.ToDictionary(p => p.PoiId, p => p);
            var visibleIds = Pins
                .Select(pin => pin.BindingContext as string)
                .Where(id => id != null && poiLookup.ContainsKey(id!))
                .ToHashSet()!;

            // Hash: thay đổi khi set visible POI hoặc radius của bất kỳ POI nào thay đổi
            int newHash = 0;
            foreach (var id in visibleIds.OrderBy(x => x))
            {
                newHash = HashCode.Combine(newHash, id,
                    poiLookup.TryGetValue(id, out var pp) ? pp.ActivationRadius : 0.0);
            }
            newHash = HashCode.Combine(newHash, _activeCategory);
            if (newHash == _geofenceSourceHash) return;
            _geofenceSourceHash = newHash;

            bool changed = false;

            // ── 1. Xóa cache của POI không còn visible ──
            foreach (var id in _fillByPoiId.Keys.Where(k => !visibleIds.Contains(k)).ToList())
            {
                _fillByPoiId.Remove(id);
                _linesByPoiId.Remove(id);
                changed = true;
            }

            // ── 2. Thêm cache cho POI mới xuất hiện ──
            foreach (var id in visibleIds.Where(id => !_fillByPoiId.ContainsKey(id)))
            {
                if (!poiLookup.TryGetValue(id, out var poi)) continue;

                double radiusM = poi.ActivationRadius > 0 ? poi.ActivationRadius : 30.0;
                double latRad  = poi.Latitude  * DegToRad;
                double lonRad  = poi.Longitude * DegToRad;
                const double R = 6_378_137.0;
                double angDist = radiusM / R;

                var pts = new Location[TotalSegments];
                for (int i = 0; i < TotalSegments; i++)
                {
                    double bearing = 2 * Math.PI * i / TotalSegments;
                    double ptLat   = Math.Asin(
                        Math.Sin(latRad) * Math.Cos(angDist) +
                        Math.Cos(latRad) * Math.Sin(angDist) * Math.Cos(bearing));
                    double ptLon   = lonRad + Math.Atan2(
                        Math.Sin(bearing) * Math.Sin(angDist) * Math.Cos(latRad),
                        Math.Cos(angDist) - Math.Sin(latRad) * Math.Sin(ptLat));
                    pts[i] = new Location(ptLat * RadToDeg, ptLon * RadToDeg);
                }

                // Fill — tạo 1 lần, không bao giờ mutate
                var fill = new Polygon
                {
                    StrokeWidth = 0,
                    StrokeColor = Colors.Transparent,
                    FillColor   = BoundaryFill,
                };
                foreach (var pt in pts) fill.Geopath.Add(pt);
                _fillByPoiId[id] = fill;

                // Dashed border
                var segs = new List<Polyline>();
                int idx = 0;
                while (idx < TotalSegments)
                {
                    int end = Math.Min(idx + dash + 1, TotalSegments);
                    var seg = new Polyline
                    {
                        StrokeColor = BoundaryStrokeIdle,
                        StrokeWidth = BoundaryIdleWidth,
                    };
                    seg.SetValue(BindableObject.BindingContextProperty, id);
                    for (int j = idx; j < end; j++)
                        seg.Geopath.Add(pts[j]);
                    segs.Add(seg);
                    idx += dash + gap;
                }
                _linesByPoiId[id] = segs;
                changed = true;
            }

            if (!changed) return;
            GeofenceVersion++;
            OnPropertyChanged(nameof(GeofenceVersion));
        }


        /// <summary>
        /// S1-3: Highlight the active POI's boundary (thicker + brighter stroke).
        /// Call when user taps a pin.
        /// </summary>
        public void HighlightActivePoi(string? poiId)
        {
            MainThread.BeginInvokeOnMainThread(() =>
            {
                foreach (var (id, segs) in _linesByPoiId)
                {
                    bool isActive = id == poiId;
                    foreach (var seg in segs)
                    {
                        seg.StrokeColor = isActive ? BoundaryStrokeActive : BoundaryStrokeIdle;
                        seg.StrokeWidth = isActive ? BoundaryActiveWidth  : BoundaryIdleWidth;
                    }
                }
            });
        }

        /// <summary>Resets all boundaries to default style.</summary>
        public void ClearPoiHighlight() => HighlightActivePoi(null);

        public async Task InitAsync()
        {
            try
            {
                await _location.StartAsync();
            }
            catch
            {
                // Location may not be available
            }
        }

        public void CenterOnUser()
        {
            if (UserLocation != null)
                MoveTo(UserLocation.Latitude, UserLocation.Longitude);
        }

        public string MapStatusLabel => Pins.Count > 0
            ? string.Format(AppStrings.Get("search_poi_points"), Pins.Count)
            : AppStrings.Get("map_status");

        public string MapTitle => AppStrings.Get("map_title");
        public string MapListenLabel => AppStrings.Get("map_listen");
        public string MapDetailsLabel => AppStrings.Get("map_details");
        public string MapDirectionsLabel => AppStrings.Get("map_directions");

        public void MoveTo(double lat, double lon, double radiusKm = 1.0)
        {
            VisibleRegion = MapSpan.FromCenterAndRadius(
                new Location(lat, lon),
                Distance.FromKilometers(radiusKm));
        }

        private void OnLocationUpdated(object? sender, (double Lat, double Lon) e)
        {
            UserLocation = new Location(e.Lat, e.Lon);
            OnPropertyChanged(nameof(SelectedPoiDistanceLabel));
            // Di chuyển bản đồ theo user lần đầu tiên (chỉ khi chưa có VisibleRegion)
            if (VisibleRegion is null)
                MoveTo(e.Lat, e.Lon);
        }
    }
}
