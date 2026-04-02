using AudioGo.Helpers;
using AudioGo.Services;
using AudioGo.Services.Interfaces;
using AudioGo.ViewModels;
using Shared;

namespace AudioGo.ViewModels
{
    public class MainViewModel : BaseViewModel
    {
        private readonly SyncService _sync;
        private readonly IApiService _api;
        private readonly IGeofenceService _geofence;
        private readonly IAudioService _audio;
        private readonly ILocationService _location;

        // ── State ──────────────────────────────────────────────────
        private List<POI> _pois = new();
        public List<POI> Pois
        {
            get => _pois;
            private set { SetProperty(ref _pois, value); }
        }

        private POI? _activePoi;
        public POI? ActivePoi
        {
            get => _activePoi;
            private set { SetProperty(ref _activePoi, value); }
        }

        private bool _isLoading;
        public new bool IsLoading
        {
            get => _isLoading;
            private set { SetProperty(ref _isLoading, value); }
        }

        private string _statusMessage = "Chờ GPS...";
        public string StatusMessage
        {
            get => _statusMessage;
            private set { SetProperty(ref _statusMessage, value); }
        }

        private string _currentLanguage = LanguageHelper.GetDeviceLanguageCode();
        public string CurrentLanguage
        {
            get => _currentLanguage;
            set
            {
                if (SetProperty(ref _currentLanguage, value))
                    _ = ReloadPoisAsync();
            }
        }

        public bool IsAudioPlaying => _audio.IsPlaying;

        // ── Missing properties from XAML bindings ──
        public bool HasNearbyPois => _pois.Count > 0;
        public List<POI> NearbyPois => _pois;
        public bool NearbyEmpty => _pois.Count == 0;
        public bool HasActivePoi => _activePoi is not null;

        private List<object> _recentTours = new();
        public List<object> RecentTours
        {
            get => _recentTours;
            private set { SetProperty(ref _recentTours, value); }
        }

        public MainViewModel(SyncService sync, IApiService api, IGeofenceService geofence,
                             IAudioService audio, ILocationService location)
        {
            _sync = sync;
            _api = api;
            _geofence = geofence;
            _audio = audio;
            _location = location;

            _geofence.PoiTriggered += OnPoiTriggered;
            _location.LocationUpdated += OnLocationUpdated;
        }

        public async Task InitAsync()
        {
            IsLoading = true;
            StatusMessage = "Đang tải dữ liệu...";
            try
            {
                Pois = await _sync.GetPoisAsync(CurrentLanguage);
                RecentTours = (await _api.GetToursAsync(CurrentLanguage)).Cast<object>().ToList();
                OnPropertyChanged(nameof(HasNearbyPois));
                OnPropertyChanged(nameof(NearbyEmpty));
                await _geofence.StartMonitoringAsync(Pois);
                await _location.StartAsync();
                StatusMessage = $"Đang theo dõi {Pois.Count} điểm";
            }
            catch (Exception ex)
            {
                StatusMessage = $"Lỗi: {ex.Message}";
            }
            finally
            {
                IsLoading = false;
            }
        }

        public async Task ReloadPoisAsync()
        {
            IsLoading = true;
            StatusMessage = "Đang chuyển ngôn ngữ...";
            try
            {
                await _audio.StopAsync();
                Pois = await _sync.GetPoisAsync(CurrentLanguage);
                RecentTours = (await _api.GetToursAsync(CurrentLanguage)).Cast<object>().ToList();
                OnPropertyChanged(nameof(HasNearbyPois));
                OnPropertyChanged(nameof(NearbyEmpty));
                await _geofence.StartMonitoringAsync(Pois);
                StatusMessage = $"Đang theo dõi {Pois.Count} điểm ({CurrentLanguage})";
            }
            catch (Exception ex)
            {
                StatusMessage = $"Lỗi: {ex.Message}";
            }
            finally
            {
                IsLoading = false;
            }
        }

        public async Task StopAsync()
        {
            await _geofence.StopMonitoringAsync();
            await _location.StopAsync();
            await _audio.StopAsync();
        }

        /// <summary>Called from MapPage mini-play FAB to (re)play the active POI audio.</summary>
        public async Task TriggerAudioAsync(POI poi)
        {
            if (!string.IsNullOrEmpty(poi.AudioUrl))
                await _audio.PlayFileAsync(poi.AudioUrl);
            else if (!string.IsNullOrEmpty(poi.Description))
                await _audio.SpeakAsync(poi.Description, poi.LanguageCode);
            OnPropertyChanged(nameof(IsAudioPlaying));
        }

        public void ToggleAudio()
        {
            if (ActivePoi is null) return;
            if (_audio.IsPlaying)
            {
                _ = _audio.StopAsync();
            }
            else
            {
                _ = TriggerAudioAsync(ActivePoi);
            }
            OnPropertyChanged(nameof(IsAudioPlaying));
        }

        public async Task StopAudio()
        {
            await _audio.StopAsync();
            OnPropertyChanged(nameof(IsAudioPlaying));
        }

        private void OnLocationUpdated(object? sender, (double Lat, double Lon) loc)
            => _geofence.OnLocationUpdated(loc.Lat, loc.Lon);

        private async void OnPoiTriggered(object? sender, POI poi)
        {
            ActivePoi = poi;
            StatusMessage = $"Đang phát: {poi.Title}";
            OnPropertyChanged(nameof(IsAudioPlaying));

            if (!string.IsNullOrEmpty(poi.AudioUrl))
                await _audio.PlayFileAsync(poi.AudioUrl);
            else if (!string.IsNullOrEmpty(poi.Description))
                await _audio.SpeakAsync(poi.Description, poi.LanguageCode);

            OnPropertyChanged(nameof(IsAudioPlaying));
        }
    }
}
