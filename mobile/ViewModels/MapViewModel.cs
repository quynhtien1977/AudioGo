using AudioGo.Services.Interfaces;
using Microsoft.Maui.Controls.Maps;
using Microsoft.Maui.Maps;
using Shared;
using System.Collections.ObjectModel;
using System.Windows.Input;

namespace AudioGo.ViewModels
{
    public class MapViewModel : BaseViewModel
    {
        private readonly ILocationService _location;
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

        /// <summary>Distance label for POI banner, e.g. "cách 150m".</summary>
        public string SelectedPoiDistanceLabel
        {
            get
            {
                if (_selectedPoi is null || _userLocation is null) return string.Empty;
                var dist = AudioGo.Helpers.GeoHelper.HaversineMeters(
                    _userLocation.Latitude, _userLocation.Longitude,
                    _selectedPoi.Latitude, _selectedPoi.Longitude);
                return dist < 1000
                    ? $"cách {(int)dist}m"
                    : $"cách {dist / 1000.0:F1}km";
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
                return $"~{minutes} phút đi bộ";
            }
        }

        public MapViewModel(ILocationService location, IApiService api)
        {
            _location = location;
            _api = api;
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
        }

        private async Task LoadCategoriesAsync()
        {
            try
            {
                var apiCategories = await _api.GetCategoriesAsync();
                if (apiCategories.Count == 0) return;

                var lang = AudioGo.Helpers.LanguageHelper.GetDeviceLanguageCode();
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
                        Label = poi.Title ?? "Không tên",
                        Address = poi.Description ?? string.Empty,
                        Location = new Location(poi.Latitude, poi.Longitude),
                        Type = PinType.Place,
                        ImageUrl = poi.LogoUrl ?? string.Empty
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
            // Update geofence overlays in sync
            BuildGeofenceCircles();
        }

        // ─── Geofence circles ────────────────────────────────────────────────────

        /// <summary>Polygons approximating each POI's activation radius (64 segments).</summary>
        public List<Polygon> GeofencePolygons { get; private set; } = new();

        private const double DegToRad = Math.PI / 180.0;
        private const double RadToDeg = 180.0 / Math.PI;

        /// <summary>Rebuilds geofence polygons from the currently visible _sourcePois.</summary>
        public void BuildGeofenceCircles()
        {
            const int segments = 64;

            var filtered = _sourcePois.Where(p =>
            {
                if (p.Latitude is 0 && p.Longitude is 0) return false;
                if (p.Latitude is < -90 or > 90) return false;
                if (p.Longitude is < -180 or > 180) return false;
                if (!string.IsNullOrEmpty(_activeCategory))
                    if (p.Categories == null || !p.Categories.Contains(_activeCategory)) return false;
                return true;
            }).ToList();

            var newPolygons = new List<Polygon>(filtered.Count);

            foreach (var poi in filtered)
            {
                double radiusM = poi.ActivationRadius > 0 ? poi.ActivationRadius : 30.0;
                var poly = new Polygon
                {
                    StrokeColor      = Color.FromArgb("#80E53935"),   // red 50% opacity
                    StrokeWidth      = 1.5f,
                    FillColor        = Color.FromArgb("#1AE53935"),   // red 10% tint
                };

                double latRad  = poi.Latitude  * DegToRad;
                double lonRad  = poi.Longitude * DegToRad;
                // Earth radius in meters
                double R = 6_378_137.0;
                double angDist = radiusM / R;

                for (int i = 0; i < segments; i++)
                {
                    double bearing = 2 * Math.PI * i / segments;
                    double ptLat = Math.Asin(
                        Math.Sin(latRad) * Math.Cos(angDist) +
                        Math.Cos(latRad) * Math.Sin(angDist) * Math.Cos(bearing));
                    double ptLon = lonRad + Math.Atan2(
                        Math.Sin(bearing) * Math.Sin(angDist) * Math.Cos(latRad),
                        Math.Cos(angDist) - Math.Sin(latRad) * Math.Sin(ptLat));
                    poly.Geopath.Add(new Location(ptLat * RadToDeg, ptLon * RadToDeg));
                }

                newPolygons.Add(poly);
            }

            GeofencePolygons = newPolygons;
            OnPropertyChanged(nameof(GeofencePolygons));
        }

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
            ? $"{Pins.Count} địa điểm quanh bạn"
            : "Đang tải địa điểm...";

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
