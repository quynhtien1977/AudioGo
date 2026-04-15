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

        // ── Location state ──────────────────────────────────────────
        private (double Lat, double Lon)? _userLocation;
        private const double NearbyDisplayRadiusM = 50.0; // "điểm gần bạn" display radius (separate from geofence ActivationRadius)

        // ── Pause tracking (to fix mini-player cross-POI resume bug) ───────
        private string? _pausedPoiId; // PoiId currently held in IsPaused state


        // ── State ──────────────────────────────────────────────────
        private List<POI> _pois = new();
        public List<POI> Pois
        {
            get => _pois;
            private set
            {
                SetProperty(ref _pois, value);
                UpdateNearbyPois();
            }
        }

        private void UpdateNearbyPois()
        {
            if (_userLocation is null)
            {
                _nearbyPois.Clear();
                foreach (var p in _pois) _nearbyPois.Add(p);
            }
            else
            {
                var (uLat, uLon) = _userLocation.Value;
                var nearby = _pois
                    .Select(p => (poi: p,
                                  dist: AudioGo.Helpers.GeoHelper.HaversineMeters(
                                            uLat, uLon, p.Latitude, p.Longitude)))
                    .Where(x => x.dist <= NearbyDisplayRadiusM)          // cố định 50m
                    .OrderBy(x => x.dist)
                    .Select(x => x.poi)
                    .ToList();

                _nearbyPois.Clear();
                foreach (var p in nearby) _nearbyPois.Add(p);
            }

            OnPropertyChanged(nameof(HasNearbyPois));
            OnPropertyChanged(nameof(NearbyEmpty));
        }

        // ── Computed display properties (MainPage XAML bindings) ──────
        private ObservableCollection<POI> _nearbyPois = new();
        public ObservableCollection<POI> NearbyPois => _nearbyPois;

        public bool HasNearbyPois => _nearbyPois.Count > 0;
        public bool NearbyEmpty   => _nearbyPois.Count == 0;
        public bool HasActivePoi  => _activePoi is not null;
        public bool IsAudioPaused => !_audio.IsPlaying;
    /// <summary>Icon Material cho mini-player: pause khi đang phát, play khi dừng/paused.</summary>
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

        /// <summary>Toggle play/pause — được gọi từ MainPage/MapPage mini-player Pause button.</summary>
        public void ToggleAudio()
        {
            if (_audio.IsPlaying)
            {
                // Pause and remember which POI we paused
                _pausedPoiId = _activePoi?.PoiId;
                _ = _audio.PauseAsync();
                OnPropertyChanged(nameof(IsAudioPlaying));
                OnPropertyChanged(nameof(IsAudioPaused));
                OnPropertyChanged(nameof(MiniPlayerPlayIcon));
            }
            else if (_audio.IsPaused)
            {
                // If ActivePoi changed since pause → play the new one instead of resuming old
                if (_pausedPoiId != _activePoi?.PoiId && _activePoi is { } newPoi)
                {
                    _pausedPoiId = null;
                    _ = TriggerAudioAsync(newPoi);
                }
                else
                {
                    _pausedPoiId = null;
                    _ = _audio.ResumeAsync();
                    OnPropertyChanged(nameof(IsAudioPlaying));
                    OnPropertyChanged(nameof(IsAudioPaused));
                    OnPropertyChanged(nameof(MiniPlayerPlayIcon));
                }
            }
            else if (ActivePoi is { } poi)
                _ = TriggerAudioAsync(poi);
        }

        /// <summary>Called from MapPage/MainPage to (re)play the active POI audio.</summary>
        public async Task TriggerAudioAsync(POI poi)
        {
            // If audio is paused for a DIFFERENT poi, stop it cleanly first
            if (_audio.IsPaused && _pausedPoiId != poi.PoiId)
                await _audio.StopAsync();
            else if (_audio.IsPlaying)
                await _audio.StopAsync();

            _pausedPoiId = null;
            ActivePoi = poi;

            // PlayPoiAudioAsync xử lý toàn bộ fallback chain: Local → Stream → TTS
            // Nếu stream HTTP fail (timeout/network), tự động fallback sang TTS Description
            await _audio.PlayPoiAudioAsync(
                localAudioPath: poi.LocalAudioPath,
                audioUrl: poi.AudioUrl,
                fallbackText: poi.Description,
                languageCode: string.IsNullOrEmpty(poi.LanguageCode) ? "vi" : poi.LanguageCode);

            OnPropertyChanged(nameof(IsAudioPlaying));
            OnPropertyChanged(nameof(IsAudioPaused));
            OnPropertyChanged(nameof(MiniPlayerPlayIcon));
        }

        private void OnLocationUpdated(object? sender, (double Lat, double Lon) loc)
        {
            _userLocation = (loc.Lat, loc.Lon);
            _geofence.OnLocationUpdated(loc.Lat, loc.Lon);
            // Refresh nearby list whenever GPS position changes
            UpdateNearbyPois();
        }

        private async void OnPoiTriggered(object? sender, POI poi)
        {
            StatusMessage = $"Đang tự động phát: {poi.Title}";
            await TriggerAudioAsync(poi);
        }

        public void UpdatePoiAudioPath(POI updatedPoi)
        {
            var poi = _pois.FirstOrDefault(p => p.PoiId == updatedPoi.PoiId);
            if (poi is not null)
            {
                poi.LocalAudioPath = updatedPoi.LocalAudioPath;
            }

            var nearbyPoi = _nearbyPois.FirstOrDefault(p => p.PoiId == updatedPoi.PoiId);
            if (nearbyPoi is not null)
            {
                nearbyPoi.LocalAudioPath = updatedPoi.LocalAudioPath;
            }
        }
    }
}
