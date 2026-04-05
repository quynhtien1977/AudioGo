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

        public ObservableCollection<Pin> Pins { get; } = new();
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
                    var pin = new Pin
                    {
                        Label = poi.Title ?? "Không tên",
                        Address = poi.Description ?? string.Empty,
                        Location = new Location(poi.Latitude, poi.Longitude),
                        Type = PinType.Place,
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
            // Di chuyển bản đồ theo user lần đầu tiên (chỉ khi chưa có VisibleRegion)
            if (VisibleRegion is null)
                MoveTo(e.Lat, e.Lon);
        }
    }
}
