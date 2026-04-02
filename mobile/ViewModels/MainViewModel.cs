using AudioGo.Helpers;
using AudioGo.Services;
using AudioGo.Services.Interfaces;
using AudioGo.ViewModels;
using AudioGo_Mobile.Views;
using Shared;
using System.Windows.Input;

namespace AudioGo.ViewModels
{
    public class MainViewModel : BaseViewModel
    {
        private readonly SyncService _sync;
        private readonly IApiService _api;
        private readonly IGeofenceService _geofence;
        private readonly IAudioService _audio;
        private readonly ILocationService _location;

        private bool _isInitialized;

        // ── Commands (bound from XAML) ───────────────────────────────
        public ICommand PlayPoiCommand { get; }
        public ICommand OpenPoiDetailCommand { get; }
        public ICommand OpenTourCommand { get; }
        public ICommand SelectCategoryCommand { get; }

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
        public bool HasNearbyPois => FilteredPois.Count > 0;
        public bool NearbyEmpty   => FilteredPois.Count == 0;
        public List<POI> NearbyPois => FilteredPois;
        public bool HasActivePoi => _activePoi is not null;

        // ── Category filter (dynamic from DB) ─────────────────────────
        private List<string> _distinctCategories = ["Tất cả"];
        public List<string> DistinctCategories
        {
            get => _distinctCategories;
            private set { SetProperty(ref _distinctCategories, value); }
        }

        private string _selectedCategory = "Tất cả";
        public string SelectedCategory
        {
            get => _selectedCategory;
            set
            {
                if (SetProperty(ref _selectedCategory, value))
                {
                    OnPropertyChanged(nameof(FilteredPois));
                    OnPropertyChanged(nameof(NearbyPois));
                    OnPropertyChanged(nameof(HasNearbyPois));
                    OnPropertyChanged(nameof(NearbyEmpty));
                }
            }
        }

        public List<POI> FilteredPois
        {
            get
            {
                if (_selectedCategory == "Tất cả" || string.IsNullOrEmpty(_selectedCategory))
                    return _pois;
                return _pois
                    .Where(p => p.Categories.Contains(_selectedCategory, StringComparer.OrdinalIgnoreCase))
                    .ToList();
            }
        }

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

            // ── Initialize Commands ──────────────────────────────────
            PlayPoiCommand = new Command<POI>(async poi =>
            {
                if (poi is null) return;
                await TriggerAudioAsync(poi);
            });

            OpenPoiDetailCommand = new Command<POI>(async poi =>
            {
                if (poi is null) return;
                await Shell.Current.GoToAsync(
                    $"{nameof(PoiDetailPage)}?poiId={poi.PoiId}");
            });

            OpenTourCommand = new Command<object>(async tour =>
            {
                if (tour is null) return;
                // Tour object may have a TourId property; use reflection-safe access
                var tourId = tour.GetType().GetProperty("TourId")?.GetValue(tour)?.ToString();
                if (!string.IsNullOrEmpty(tourId))
                    await Shell.Current.GoToAsync(
                        $"{nameof(TourDetailPage)}?tourId={tourId}");
            });

            SelectCategoryCommand = new Command<string>(cat =>
            {
                SelectedCategory = cat ?? "Tất cả";
            });
        }

        public async Task InitAsync()
        {
            // Guard: chỉ init 1 lần, tránh re-fetch mỗi khi quay lại trang
            if (_isInitialized) return;

            IsLoading = true;
            StatusMessage = "Đang tải dữ liệu...";
            try
            {
                // Chạy song song các tác vụ độc lập để giảm thời gian load
                var poisTask = _sync.GetPoisAsync(CurrentLanguage);
                var toursTask = SafeGetToursAsync();

                await Task.WhenAll(poisTask, toursTask);

                Pois = poisTask.Result;
                RecentTours = toursTask.Result;

                // Rebuild distinct category list from DB data
                var cats = _pois
                    .SelectMany(p => p.Categories)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(c => c)
                    .ToList();
                DistinctCategories = ["Tất cả", .. cats];

                OnPropertyChanged(nameof(HasNearbyPois));
                OnPropertyChanged(nameof(NearbyPois));
                OnPropertyChanged(nameof(NearbyEmpty));

                // Geofence và Location chạy nền sau khi UI đã render
                _ = Task.Run(async () =>
                {
                    await _geofence.StartMonitoringAsync(Pois);
                    await _location.StartAsync();
                });

                StatusMessage = $"Đang theo dõi {Pois.Count} điểm";
                _isInitialized = true;
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

                var poisTask = _sync.GetPoisAsync(CurrentLanguage);
                var toursTask = SafeGetToursAsync();

                await Task.WhenAll(poisTask, toursTask);

                Pois = poisTask.Result;
                RecentTours = toursTask.Result;

                OnPropertyChanged(nameof(HasNearbyPois));
                OnPropertyChanged(nameof(NearbyPois));
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

        // ── Private Helpers ──────────────────────────────────────────

        /// <summary>Wrap tour API call with fallback to prevent crash when API unavailable.</summary>
        private async Task<List<object>> SafeGetToursAsync()
        {
            try
            {
                return (await _api.GetToursAsync(CurrentLanguage)).Cast<object>().ToList();
            }
            catch
            {
                return new List<object>();
            }
        }

        private void OnLocationUpdated(object? sender, (double Lat, double Lon) loc)
            => _geofence.OnLocationUpdated(loc.Lat, loc.Lon);

        private async void OnPoiTriggered(object? sender, POI poi)
        {
            ActivePoi = poi;
            OnPropertyChanged(nameof(HasActivePoi));
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
