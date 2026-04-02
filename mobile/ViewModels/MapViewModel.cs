using AudioGo.Services.Interfaces;
using Microsoft.Maui.Controls.Maps;
using Microsoft.Maui.Maps;
using Shared;
using System.Collections.ObjectModel;

namespace AudioGo.ViewModels
{
    public class MapViewModel : BaseViewModel
    {
        private readonly ILocationService _location;

        public ObservableCollection<Pin> Pins { get; } = new();

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

        public MapViewModel(ILocationService location)
        {
            _location = location;
            _location.LocationUpdated += OnLocationUpdated;
        }

        public void LoadPois(IEnumerable<POI> pois)
        {
            Pins.Clear();
            foreach (var poi in pois)
            {
                // Bỏ qua POI có tọa độ không hợp lệ (0,0 hoặc ngoài phạm vi)
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
                    // Gắn PoiId vào BindingContext để dùng khi navigate
                    pin.BindingContext = poi.PoiId;
                    Pins.Add(pin);
                }
                catch
                {
                    // Pin creation failed — skip this POI, don't crash entire map
                    System.Diagnostics.Debug.WriteLine(
                        $"[MapVM] Failed to create pin for POI {poi.PoiId}");
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
