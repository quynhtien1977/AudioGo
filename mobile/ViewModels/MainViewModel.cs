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

        // ── Delta polling ────────────────────────────────────────────
        private CancellationTokenSource? _deltaCts;
        private static readonly TimeSpan DeltaPollInterval = TimeSpan.FromMinutes(1);

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
        public string AreaName => AppStrings.Get("main_area_name");
        public string AreaSubTitle => AppStrings.Get("main_area_sub");
        public string HomePageTitle => AppStrings.Get("tab_home");
        public string HeroDiscoverLabel => AppStrings.Get("main_hero_discover");
        public string HeroFoodStreetLabel => AppStrings.Get("main_hero_food_street");
        public string HeroVinhKhanhLabel => AppStrings.Get("main_hero_vinh_khanh");
        public string NearbyTitle => AppStrings.Get("nearby_title");
        public string NearbyViewAll => AppStrings.Get("nearby_view_all");
        public string NearbyEmptyTitle => AppStrings.Get("nearby_empty_title");
        public string NearbyEmptyDesc => AppStrings.Get("nearby_empty_desc");
        public string MiniPlayerNowPlaying => AppStrings.Get("mini_playing");
        
        // Map Page Labels
        public string MapTitle => AppStrings.Get("map_title");
        public string MapListenLabel => AppStrings.Get("map_listen");
        public string MapDetailsLabel => AppStrings.Get("map_details");
        public string MapDirectionsLabel => AppStrings.Get("map_directions");

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



        private string _statusMessage = AppStrings.Get("status_gps");
        public string StatusMessage
        {
            get => _statusMessage;
            private set { SetProperty(ref _statusMessage, value); }
        }

        private string _currentLanguage = AppSettings.GetAppLanguage();
        public string CurrentLanguage
        {
            get => _currentLanguage;
            private set => SetProperty(ref _currentLanguage, LanguageHelper.NormalizeToSupported(value));
        }

        public bool AllowCellularDownloads => AppSettings.IsCellularDownloadsAllowed();
        public string DownloadPolicyLabel => AllowCellularDownloads
            ? AppStrings.Get("settings_cellular_on")
            : AppStrings.Get("settings_cellular_off");

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
            _sync.LanguageChanged += OnLanguageChanged;

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
                StatusMessage = AppStrings.Get("status_loading");
            try
            {
                Pois = await _sync.GetPoisAsync(CurrentLanguage);
                await _geofence.StartMonitoringAsync(Pois);
                await _location.StartAsync();
                StatusMessage = AppStrings.Get("status_tracking", Pois.Count.ToString());
            }
            catch (Exception ex)
            {
                StatusMessage = AppStrings.Get("status_tracking", Pois.Count.ToString());
                MainThread.BeginInvokeOnMainThread(async () =>
                {
                    try { await CommunityToolkit.Maui.Alerts.Toast.Make(AppStrings.Get("error_prefix", ex.Message)).Show(); } catch { }
                });
            }
            finally
            {
                IsLoading = false;
            }

            // Sau khi init xong, bắt đầu vòng lặp delta polling 5 phút
            StartDeltaPolling();
        }

                public async Task ChangeLanguageAsync(string languageCode)
        {
            var normalized = LanguageHelper.NormalizeToSupported(languageCode);
            if (normalized == CurrentLanguage) return;

            IsLoading = true;
            StatusMessage = AppStrings.Get("status_updating_lang");
            try
            {
                var newPois = await _sync.SwitchLanguageAsync(normalized);
                if (newPois is null)
                    throw new Exception("Cannot switch language (offline or data unavailable).");

                await _audio.StopAsync();
                CurrentLanguage = normalized;
                AppSettings.SetAppLanguage(normalized);

                Pois = newPois;
                await _geofence.StartMonitoringAsync(Pois);
                StatusMessage = AppStrings.Get("status_tracking", Pois.Count.ToString());
                _sync.NotifyLanguageChanged(normalized);
            }
            catch (Exception)
            {
                StatusMessage = AppStrings.Get("status_tracking", Pois.Count.ToString());
                throw;
            }
            finally
            {
                IsLoading = false;
            }
        }
        public async Task ReloadPoisAsync()
        {
            IsLoading = true;
            try
            {
                await _audio.StopAsync();
                Pois = await _sync.GetPoisAsync(CurrentLanguage);
                await _geofence.StartMonitoringAsync(Pois);
                StatusMessage = AppStrings.Get("status_tracking", Pois.Count.ToString());
            }
            catch (Exception ex)
            {
                StatusMessage = AppStrings.Get("status_tracking", Pois.Count.ToString());
                MainThread.BeginInvokeOnMainThread(async () =>
                {
                    try { await CommunityToolkit.Maui.Alerts.Toast.Make(AppStrings.Get("error_prefix", ex.Message)).Show(); } catch { }
                });
            }
            finally
            {
                IsLoading = false;
            }
        }
        
        private void OnLanguageChanged(object? sender, string newLang)
        {
            if (CurrentLanguage != newLang)
            {
                CurrentLanguage = newLang;
            }

            OnPropertyChanged(nameof(HomePageTitle));
            OnPropertyChanged(nameof(AreaName));
            OnPropertyChanged(nameof(AreaSubTitle));
            OnPropertyChanged(nameof(HeroDiscoverLabel));
            OnPropertyChanged(nameof(HeroFoodStreetLabel));
            OnPropertyChanged(nameof(HeroVinhKhanhLabel));
            OnPropertyChanged(nameof(NearbyTitle));
            OnPropertyChanged(nameof(NearbyViewAll));
            OnPropertyChanged(nameof(NearbyEmptyTitle));
            OnPropertyChanged(nameof(NearbyEmptyDesc));
            OnPropertyChanged(nameof(MiniPlayerNowPlaying));
            OnPropertyChanged(nameof(DownloadPolicyLabel));
            OnPropertyChanged(nameof(MapTitle));
            OnPropertyChanged(nameof(MapListenLabel));
            OnPropertyChanged(nameof(MapDetailsLabel));
            OnPropertyChanged(nameof(MapDirectionsLabel));

            if (!IsLoading)
                StatusMessage = AppStrings.Get("status_tracking", Pois.Count.ToString());
        }

        public async Task StopAsync()
        {
            StopDeltaPolling();
            await _geofence.StopMonitoringAsync();
            await _location.StopAsync();
            await _audio.StopAsync();
        }

        // ── Delta polling helpers ────────────────────────────────────
        private void StartDeltaPolling()
        {
            StopDeltaPolling();                         // safety: cancel previous
            _deltaCts = new CancellationTokenSource();
            _ = Task.Run(() => DeltaPollLoopAsync(_deltaCts.Token));
        }

        private void StopDeltaPolling()
        {
            _deltaCts?.Cancel();
            _deltaCts?.Dispose();
            _deltaCts = null;
        }

        private async Task DeltaPollLoopAsync(CancellationToken ct)
        {
            try
            {
                using var timer = new PeriodicTimer(DeltaPollInterval);
                while (await timer.WaitForNextTickAsync(ct))
                {
                    try
                    {
                        var updated = await _sync.ApplyDeltaAsync(CurrentLanguage, ct);
                        if (updated is not null && updated.Count >= 0)
                        {
                            // Có thay đổi → cập nhật UI trên main thread
                            await MainThread.InvokeOnMainThreadAsync(async () =>
                            {
                                Pois = updated;
                                await _geofence.StartMonitoringAsync(Pois);
                                StatusMessage = AppStrings.Get("status_tracking", Pois.Count.ToString());
                            });
                        }
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"[DeltaPoll] tick error: {ex.Message}");
                    }
                }
            }
            catch (OperationCanceledException) { /* expected on StopAsync */ }
        }

        public async Task SetCellularDownloadsAsync(bool allowed)
        {
            AppSettings.SetCellularDownloadsAllowed(allowed);
            OnPropertyChanged(nameof(AllowCellularDownloads));
            OnPropertyChanged(nameof(DownloadPolicyLabel));

            if (allowed)
            {
                StatusMessage = AppStrings.Get("status_downloading_cellular");
                await _sync.RetryPendingDownloadsAsync();
            }
            else
            {
                StatusMessage = AppStrings.Get("status_wifi_only");
            }
        }

        public void StopAudio()
        {
            _ = _audio.StopAsync();
            ActivePoi = null;
            StatusMessage = AppStrings.Get("status_tracking", Pois.Count.ToString());
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
            StatusMessage = AppStrings.Get("status_auto_playing", poi.Title);
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
