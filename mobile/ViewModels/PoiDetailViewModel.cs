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
        private readonly AudioService? _audioConcrete; // for CurrentPositionSeconds

        private IDispatcherTimer? _progressTimer;

        // ── Query parameter ────────────────────────────────────────
        private string _poiId = string.Empty;
        public string PoiId
        {
            get => _poiId;
            set
            {
                SetProperty(ref _poiId, value);
                Task.Run(() => LoadAsync(value));
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

        // ── Audio state ────────────────────────────────────────────
        public bool   IsPlaying     => _audio.IsPlaying;
        public string PlayPauseIcon => _audio.IsPlaying ? "\ue034" : "\ue037";

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

        /// <summary>Rendered pixel width of the seekbar track — set from code-behind SizeChanged.</summary>
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

        /// <summary>
        /// X offset (dp) for the thumb Ellipse, so it sits on top of the current progress position.
        /// ThumbRadius = 7 (half of 14dp ellipse). Clamped to [0, trackWidth - thumbDiameter].
        /// </summary>
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

        private string _speedText = "1×";
        public string SpeedText
        {
            get => _speedText;
            private set { SetProperty(ref _speedText, value); }
        }

        private readonly float[] _speeds = [0.75f, 1f, 1.25f, 1.5f, 2f];
        private int _speedIndex = 1;

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
        public PoiDetailViewModel(AppDatabase db, IAudioService audio)
        {
            _db    = db;
            _audio = audio;
            _audioConcrete = audio as AudioService;

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
        /// <summary>
        /// Called on main thread whenever AudioService changes state —
        /// including when MainPage mini-player stops/pauses audio.
        /// </summary>
        private void OnAudioStateChanged(object? sender, AudioStateChangedEventArgs e)
        {
            // Update play/pause icon
            OnPropertyChanged(nameof(IsPlaying));
            OnPropertyChanged(nameof(PlayPauseIcon));

            if (e.IsPlaying)
            {
                // Update TotalTime once we know duration
                if (e.DurationSeconds > 0)
                    TotalTime = FormatTime(e.DurationSeconds);
                StartProgressTimer();
            }
            else
            {
                StopProgressTimer();
                if (e.PlaybackEnded)
                {
                    // Playback finished naturally — show full bar briefly then reset
                    AudioProgress = 1.0;
                    CurrentTime   = TotalTime;
                }
                else
                {
                    // Stopped by user — reset bar
                    AudioProgress = 0;
                    CurrentTime   = "0:00";
                    TotalTime     = "--:--";
                }
            }
        }

        // ── Load data ──────────────────────────────────────────────
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

        // ── Progress timer ─────────────────────────────────────────
        private void StartProgressTimer()
        {
            StopProgressTimer();
            _progressTimer = Application.Current?.Dispatcher.CreateTimer();
            if (_progressTimer is null) return;
            _progressTimer.Interval = TimeSpan.FromMilliseconds(300);
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
            if (!_audio.IsPlaying)
            {
                StopProgressTimer();
                OnPropertyChanged(nameof(IsPlaying));
                OnPropertyChanged(nameof(PlayPauseIcon));
                return;
            }

            double duration = _audio.DurationSeconds;
            double position = _audioConcrete?.CurrentPositionSeconds ?? 0;

            if (duration > 0 && position >= 0)
            {
                AudioProgress = Math.Min(1.0, position / duration);
                CurrentTime   = FormatTime(position);
                TotalTime     = FormatTime(duration);
            }
            else if (duration <= 0 && AudioProgress < 1.0)
            {
                // Fallback: simulate ~3 min if duration unknown (TTS)
                AudioProgress = Math.Min(1.0, AudioProgress + 0.3 / 180.0);
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
        public async Task TogglePlayPauseAsync()
        {
            if (IsPlaying) await StopAudioAsync();
            else           await PlayAudioAsync();
        }

        public async Task PlayAudioAsync()
        {
            if (Poi is null) return;

            // Stop existing first (prevents overlap)
            if (_audio.IsPlaying) await _audio.StopAsync();

            AudioProgress = 0;
            CurrentTime   = "0:00";
            TotalTime     = "--:--";

            if (!string.IsNullOrEmpty(Poi.LocalAudioPath) && File.Exists(Poi.LocalAudioPath))
                await _audio.PlayFileAsync(Poi.LocalAudioPath);
            else if (!string.IsNullOrEmpty(Poi.AudioUrl))
                await _audio.PlayFileAsync(Poi.AudioUrl);
            else if (!string.IsNullOrEmpty(Poi.Description))
                await _audio.SpeakAsync(Poi.Description, Poi.LanguageCode);
            // PlaybackStateChanged event will fire from AudioService to update UI
        }

        public async Task StopAudioAsync()
        {
            await _audio.StopAsync();
            // PlaybackStateChanged event will fire and reset bar
        }

        public void CycleSpeed()
        {
            _speedIndex = (_speedIndex + 1) % _speeds.Length;
            SpeedText = _speeds[_speedIndex] == 1f ? "1×" : $"{_speeds[_speedIndex]}×";
        }

        /// <summary>Called from PoiDetailPage.OnAppearing — sync icon if audio already running.</summary>
        public void RefreshAudioState()
        {
            OnPropertyChanged(nameof(IsPlaying));
            OnPropertyChanged(nameof(PlayPauseIcon));
            if (_audio.IsPlaying)
            {
                if (_audio.DurationSeconds > 0)
                    TotalTime = FormatTime(_audio.DurationSeconds);
                StartProgressTimer();
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
