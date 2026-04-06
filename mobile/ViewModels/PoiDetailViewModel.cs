using AudioGo.Data;
using AudioGo.Models;
using AudioGo.Services;
using AudioGo.Services.Interfaces;
using System.Text.Json;
using System.Windows.Input;

namespace AudioGo.ViewModels
{
    [QueryProperty(nameof(PoiId), "poiId")]
    public class PoiDetailViewModel : BaseViewModel
    {
        private readonly AppDatabase _db;
        private readonly IAudioService _audio;
        private readonly MainViewModel _mainViewModel;

        private IDispatcherTimer? _progressTimer;
        private bool _isSeeking; // true while user is dragging the seekbar

        // ── Query parameter ────────────────────────────────────────
        private string _poiId = string.Empty;
        public string PoiId
        {
            get => _poiId;
            set
            {
                SetProperty(ref _poiId, value);
                // Only stop audio if we're picking a different POI
                Task.Run(async () =>
                {
                    if (_mainViewModel.ActivePoi?.PoiId != value)
                    {
                        await _audio.StopAsync();
                    }
                    await LoadAsync(value);
                });
            }
        }

        // ── POI data ───────────────────────────────────────────────
        private PoiEntity? _poi;
        public PoiEntity? Poi
        {
            get => _poi;
            private set
            {
                SetProperty(ref _poi, value);
                OnPropertyChanged(nameof(Title));
                OnPropertyChanged(nameof(Description));
                OnPropertyChanged(nameof(CategoryTags));
                OnPropertyChanged(nameof(HeroImageUrl));
                OnPropertyChanged(nameof(GalleryImages));
                OnPropertyChanged(nameof(HasGallery));
                OnPropertyChanged(nameof(GalleryCount));
            }
        }

        // ── Computed POI properties ────────────────────────────────
        public string Title        => _poi?.Title       ?? string.Empty;
        public string Description  => _poi?.Description ?? string.Empty;
        public string HeroImageUrl => _poi?.LogoUrl     ?? string.Empty;

        public List<string> CategoryTags
        {
            get
            {
                if (_poi is null || string.IsNullOrEmpty(_poi.CategoriesJson)) return [];
                try { return JsonSerializer.Deserialize<List<string>>(_poi.CategoriesJson) ?? []; }
                catch { return []; }
            }
        }

        public List<string> GalleryImages
        {
            get
            {
                if (_poi is null || string.IsNullOrEmpty(_poi.GalleryUrlsJson)) return [];
                try
                {
                    var urls = JsonSerializer.Deserialize<List<string>>(_poi.GalleryUrlsJson) ?? [];
                    if (!string.IsNullOrEmpty(_poi.LogoUrl) && !urls.Contains(_poi.LogoUrl))
                        return [_poi.LogoUrl, .. urls];
                    return urls;
                }
                catch { return []; }
            }
        }

        public bool   HasGallery   => GalleryImages.Count > 0;
        public string GalleryCount => GalleryImages.Count > 0 ? $"{GalleryImages.Count} ảnh" : "";

        // ── Next POI navigation ────────────────────────────────────
        private List<PoiEntity> _allPois = [];
        private int _currentIndex = -1;

        public bool   HasNextPoi        => _currentIndex >= 0 && _currentIndex < _allPois.Count - 1;
        public string NextPoiTitle      => HasNextPoi ? _allPois[_currentIndex + 1].Title : string.Empty;
        public string NextPoiButtonText => HasNextPoi ? "Điểm tiếp theo →" : "Đã đến điểm cuối";

        public ICommand GoToNextPoiCommand { get; }

        // ── Description expand/collapse ────────────────────────────
        private bool _descExpanded;
        public bool DescExpanded
        {
            get => _descExpanded;
            set { SetProperty(ref _descExpanded, value); OnPropertyChanged(nameof(ExpandLabel)); }
        }
        public string ExpandLabel => _descExpanded ? "Thu gọn ▲" : "Xem thêm ▼";

        // ── Audio state — play/pause (not stop) ───────────────────
        /// <summary>True while audio is actively playing (not paused).</summary>
        public bool IsPlaying  => _audio.IsPlaying;
        public bool IsPaused   => _audio.IsPaused;

        /// <summary>pause icon when playing, play icon when paused/stopped.</summary>
        public string PlayPauseIcon => _audio.IsPlaying ? "\ue034" : "\ue037"; // pause / play_arrow

        // ── Progress ───────────────────────────────────────────────
        private double _audioProgress;
        public double AudioProgress
        {
            get => _audioProgress;
            set
            {
                SetProperty(ref _audioProgress, value);
                OnPropertyChanged(nameof(ThumbOffsetX));
            }
        }

        private double _seekbarWidth;
        public double SeekbarWidth
        {
            get => _seekbarWidth;
            set
            {
                if (Math.Abs(_seekbarWidth - value) < 0.5) return;
                _seekbarWidth = value;
                OnPropertyChanged(nameof(ThumbOffsetX));
            }
        }

        /// <summary>Pixel X offset for thumb Ellipse (HorizontalOptions=Start).</summary>
        public double ThumbOffsetX
        {
            get
            {
                const double thumbRadius = 7.0;
                if (_seekbarWidth <= 0) return 0;
                double raw = _audioProgress * _seekbarWidth - thumbRadius;
                return Math.Max(0, Math.Min(raw, _seekbarWidth - thumbRadius * 2));
            }
        }

        private string _currentTime = "0:00";
        public string CurrentTime
        {
            get => _currentTime;
            private set { SetProperty(ref _currentTime, value); }
        }

        private string _totalTime = "--:--";
        public string TotalTime
        {
            get => _totalTime;
            private set { SetProperty(ref _totalTime, value); }
        }

        // ── Speed pills ────────────────────────────────────────────
        private static readonly float[] SpeedValues = [0.75f, 1f, 1.25f, 1.5f];
        private int _selectedSpeedIndex = 1; // default 1×

        // Bool props for XAML DataTrigger pill highlight
        public bool IsSpeed075 => _selectedSpeedIndex == 0;
        public bool IsSpeed1x  => _selectedSpeedIndex == 1;
        public bool IsSpeed125 => _selectedSpeedIndex == 2;
        public bool IsSpeed15  => _selectedSpeedIndex == 3;

        public void SelectSpeed(int index)
        {
            if (index < 0 || index >= SpeedValues.Length) return;
            _selectedSpeedIndex = index;
            _audio.SetSpeed(SpeedValues[index]);
            OnPropertyChanged(nameof(IsSpeed075));
            OnPropertyChanged(nameof(IsSpeed1x));
            OnPropertyChanged(nameof(IsSpeed125));
            OnPropertyChanged(nameof(IsSpeed15));
        }

        // ── Other ──────────────────────────────────────────────────
        private int _selectedGalleryIndex;
        public int SelectedGalleryIndex
        {
            get => _selectedGalleryIndex;
            set { SetProperty(ref _selectedGalleryIndex, value); }
        }

        private string _errorMessage = string.Empty;
        public string ErrorMessage
        {
            get => _errorMessage;
            private set { SetProperty(ref _errorMessage, value); }
        }

        // ── Constructor ────────────────────────────────────────────
        public PoiDetailViewModel(AppDatabase db, IAudioService audio, MainViewModel mainViewModel)
        {
            _db    = db;
            _audio = audio;
            _mainViewModel = mainViewModel;

            // Subscribe to global audio state changes
            _audio.PlaybackStateChanged += OnAudioStateChanged;

            GoToNextPoiCommand = new Command(async () =>
            {
                if (!HasNextPoi) return;
                var next = _allPois[_currentIndex + 1];
                await Shell.Current.GoToAsync(
                    $"{nameof(AudioGo_Mobile.Views.PoiDetailPage)}?poiId={next.PoiId}");
            });
        }

        // ── Global audio state handler ─────────────────────────────
        private void OnAudioStateChanged(object? sender, AudioStateChangedEventArgs e)
        {
            OnPropertyChanged(nameof(IsPlaying));
            OnPropertyChanged(nameof(IsPaused));
            OnPropertyChanged(nameof(PlayPauseIcon));

            if (e.IsPlaying)
            {
                if (e.DurationSeconds > 0)
                    TotalTime = FormatTime(e.DurationSeconds);
                StartProgressTimer();
            }
            else if (e.IsPaused)
            {
                // Paused — stop timer, hold current position display
                StopProgressTimer();
            }
            else
            {
                StopProgressTimer();
                if (e.PlaybackEnded)
                {
                    AudioProgress = 1.0;
                    CurrentTime   = TotalTime;
                }
                else
                {
                    // Full stop — reset
                    AudioProgress = 0;
                    CurrentTime   = "0:00";
                    TotalTime     = "--:--";
                }
            }
        }

        // ── Data loading ───────────────────────────────────────────
        private async Task LoadAsync(string poiId)
        {
            if (string.IsNullOrWhiteSpace(poiId)) return;

            IsLoading = true;
            ErrorMessage = string.Empty;
            try
            {
                Poi = await _db.GetPoiAsync(poiId);
                if (Poi is null)
                {
                    ErrorMessage = "Không tìm thấy điểm tham quan.";
                }
                else
                {
                    _allPois = await _db.GetAllPoisAsync();
                    _currentIndex = _allPois.FindIndex(p => p.PoiId == poiId);
                    OnPropertyChanged(nameof(HasNextPoi));
                    OnPropertyChanged(nameof(NextPoiTitle));
                    OnPropertyChanged(nameof(NextPoiButtonText));
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Lỗi tải dữ liệu: {ex.Message}";
            }
            finally
            {
                IsLoading = false;
            }
        }

        // ── Progress timer (≈60 fps smooth) ───────────────────────
        private void StartProgressTimer()
        {
            StopProgressTimer();
            _progressTimer = Application.Current?.Dispatcher.CreateTimer();
            if (_progressTimer is null) return;
            _progressTimer.Interval = TimeSpan.FromMilliseconds(16); // ~60 fps
            _progressTimer.Tick += (_, _) => TickProgress();
            _progressTimer.Start();
        }

        private void StopProgressTimer()
        {
            _progressTimer?.Stop();
            _progressTimer = null;
        }

        private void TickProgress()
        {
            if (_isSeeking) return; // user is dragging — don't overwrite progress

            if (!_audio.IsPlaying)
            {
                StopProgressTimer();
                OnPropertyChanged(nameof(IsPlaying));
                OnPropertyChanged(nameof(PlayPauseIcon));
                return;
            }

            double duration = _audio.DurationSeconds;
            double position = _audio.CurrentPositionSeconds;

            if (duration > 0 && position >= 0)
            {
                AudioProgress = Math.Min(1.0, position / duration);
                CurrentTime   = FormatTime(position);
                TotalTime     = FormatTime(duration);
            }
            else if (duration <= 0 && AudioProgress < 1.0)
            {
                // TTS fallback — simulate 3 min
                AudioProgress = Math.Min(1.0, AudioProgress + 16.0 / 180_000.0);
                var elapsed = TimeSpan.FromSeconds(AudioProgress * 180);
                CurrentTime = $"{(int)elapsed.TotalMinutes}:{elapsed.Seconds:D2}";
            }
        }

        private static string FormatTime(double seconds)
        {
            var ts = TimeSpan.FromSeconds(seconds);
            return ts.TotalHours >= 1
                ? $"{(int)ts.TotalHours}:{ts.Minutes:D2}:{ts.Seconds:D2}"
                : $"{ts.Minutes}:{ts.Seconds:D2}";
        }

        // ── Audio controls ─────────────────────────────────────────
        /// <summary>
        /// Toggle: if playing → pause (keep position), if paused → resume, if stopped → play from start.
        /// </summary>
        public async Task TogglePlayPauseAsync()
        {
            if (_mainViewModel.ActivePoi?.PoiId == Poi?.PoiId && (_audio.IsPlaying || _audio.IsPaused))
            {
                _mainViewModel.ToggleAudio();
            }
            else
            {
                await PlayAudioAsync();
            }
        }

        public async Task PlayAudioAsync()
        {
            if (Poi is null) return;

            // Trigger through MainViewModel to keep global mini-player context in sync
            var mainPoi = _mainViewModel.Pois.FirstOrDefault(p => p.PoiId == Poi.PoiId);
            if (mainPoi != null)
            {
                AudioProgress = 0;
                CurrentTime   = "0:00";
                TotalTime     = "--:--";
                await _mainViewModel.TriggerAudioAsync(mainPoi);
            }
        }

        public async Task StopAudioAsync()
        {
            _mainViewModel.StopAudio();
            await Task.CompletedTask;
            // PlaybackStateChanged fires and resets bar to 0
        }

        /// <summary>Call when the seekbar drag starts — freezes progress display.</summary>
        public void BeginSeek() => _isSeeking = true;

        /// <summary>Call when drag ends with the slider‧s current value (0–1).</summary>
        public async Task SeekToAsync(double normalizedPosition)
        {
            _isSeeking = false;
            double dur = _audio.DurationSeconds;
            if (dur <= 0) return;

            double targetSeconds = Math.Clamp(normalizedPosition, 0, 1) * dur;
            AudioProgress = Math.Clamp(normalizedPosition, 0, 1);
            CurrentTime   = FormatTime(targetSeconds);
            await _audio.SeekAsync(targetSeconds);
        }



        // ── Sync on page appear ────────────────────────────────────
        public void RefreshAudioState()
        {
            OnPropertyChanged(nameof(IsPlaying));
            OnPropertyChanged(nameof(IsPaused));
            OnPropertyChanged(nameof(PlayPauseIcon));
            if (_audio.IsPlaying)
            {
                if (_audio.DurationSeconds > 0)
                    TotalTime = FormatTime(_audio.DurationSeconds);
                StartProgressTimer();
            }
            else if (_audio.IsPaused)
            {
                // Show existing position without starting timer
                double pos = _audio.CurrentPositionSeconds;
                double dur = _audio.DurationSeconds;
                if (dur > 0)
                {
                    AudioProgress = Math.Min(1.0, pos / dur);
                    CurrentTime   = FormatTime(pos);
                    TotalTime     = FormatTime(dur);
                }
            }
        }

        public void ToggleDescExpanded() => DescExpanded = !DescExpanded;

        // ── Cleanup ────────────────────────────────────────────────
        ~PoiDetailViewModel()
        {
            _audio.PlaybackStateChanged -= OnAudioStateChanged;
            StopProgressTimer();
        }
    }
}
