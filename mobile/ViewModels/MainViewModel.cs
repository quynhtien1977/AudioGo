using AudioGo.Helpers;
using AudioGo.Services;
using AudioGo.Services.Interfaces;
using AudioGo.ViewModels;
using Shared;
using System.Collections.ObjectModel;
using System.Windows.Input;

namespace AudioGo.ViewModels
{
    public class MainViewModel : BaseViewModel
    {
        private readonly SyncService _sync;
        private readonly IGeofenceService _geofence;
        private readonly IAudioService _audio;
        private readonly ILocationService _location;

        // ── State ──────────────────────────────────────────────────
        private List<POI> _pois = new();
        public List<POI> Pois
        {
            get => _pois;
            private set
            {
                SetProperty(ref _pois, value);
                OnPropertyChanged(nameof(NearbyPois));
                OnPropertyChanged(nameof(HasNearbyPois));
                OnPropertyChanged(nameof(NearbyEmpty));
            }
        }

        // ── Computed display properties (MainPage XAML bindings) ──────
        public ObservableCollection<POI> NearbyPois => new(_pois.Take(5));
        public bool HasNearbyPois => _pois.Count > 0;
        public bool NearbyEmpty   => _pois.Count == 0;
        public bool HasActivePoi  => _activePoi is not null;
        public bool IsAudioPaused => !_audio.IsPlaying;
        /// <summary>Icon Material cho mini-player: pause khi đang phát, play khi dừng.</summary>
        public string MiniPlayerPlayIcon => _audio.IsPlaying ? "\ue034" : "\ue037";

        // ── Commands ───────────────────────────────────────────────
        public ICommand PlayPoiCommand       { get; }
        public ICommand OpenPoiDetailCommand { get; }

        private POI? _activePoi;
        public POI? ActivePoi
        {
            get => _activePoi;
            private set
            {
                SetProperty(ref _activePoi, value);
                OnPropertyChanged(nameof(HasActivePoi));
            }
        }

        private bool _isLoading;
        public bool IsLoading
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

        public MainViewModel(SyncService sync, IGeofenceService geofence,
                             IAudioService audio, ILocationService location)
        {
            _sync = sync;
            _geofence = geofence;
            _audio = audio;
            _location = location;

            _geofence.PoiTriggered += OnPoiTriggered;
            _location.LocationUpdated += OnLocationUpdated;

            // Keep mini-player icon in sync regardless of who stops the audio
            _audio.PlaybackStateChanged += (_, _) =>
            {
                OnPropertyChanged(nameof(IsAudioPlaying));
                OnPropertyChanged(nameof(IsAudioPaused));
                OnPropertyChanged(nameof(MiniPlayerPlayIcon));
            };

            PlayPoiCommand = new Command<POI>(async poi =>
            {
                if (poi is null) return;
                ActivePoi = poi;
                await TriggerAudioAsync(poi);
            });

            OpenPoiDetailCommand = new Command<POI>(async poi =>
            {
                if (poi is null) return;
                await Shell.Current.GoToAsync(
                    $"{nameof(AudioGo_Mobile.Views.PoiDetailPage)}?poiId={poi.PoiId}");
            });
        }

        public async Task InitAsync()
        {
            IsLoading = true;
            StatusMessage = "Đang tải dữ liệu...";
            try
            {
                Pois = await _sync.GetPoisAsync(CurrentLanguage);
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

        /// <summary>Dừng audio — được gọi từ MainPage mini-player Close button.</summary>
        public void StopAudio()
        {
            _ = _audio.StopAsync();
            ActivePoi = null;
            StatusMessage = $"Đang theo dõi {Pois.Count} điểm";
            OnPropertyChanged(nameof(IsAudioPlaying));
            OnPropertyChanged(nameof(IsAudioPaused));
            OnPropertyChanged(nameof(MiniPlayerPlayIcon));
        }

        /// <summary>Toggle play/pause — được gọi từ MainPage mini-player Pause button.</summary>
        public void ToggleAudio()
        {
            if (_audio.IsPlaying)
            {
                _ = _audio.StopAsync();
                OnPropertyChanged(nameof(IsAudioPlaying));
                OnPropertyChanged(nameof(IsAudioPaused));
                OnPropertyChanged(nameof(MiniPlayerPlayIcon));
            }
            else if (ActivePoi is { } poi)
                _ = TriggerAudioAsync(poi);
        }

        /// <summary>Called from MapPage/MainPage to (re)play the active POI audio.</summary>
        public async Task TriggerAudioAsync(POI poi)
        {
            // Always stop previous audio first – prevents overlap when user taps a different POI
            if (_audio.IsPlaying)
                await _audio.StopAsync();

            if (!string.IsNullOrEmpty(poi.AudioUrl))
                await _audio.PlayFileAsync(poi.AudioUrl);
            else if (!string.IsNullOrEmpty(poi.Description))
                await _audio.SpeakAsync(poi.Description, poi.LanguageCode);

            OnPropertyChanged(nameof(IsAudioPlaying));
            OnPropertyChanged(nameof(IsAudioPaused));
            OnPropertyChanged(nameof(MiniPlayerPlayIcon));
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
