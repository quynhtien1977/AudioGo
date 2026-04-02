using AudioGo.Data;
using AudioGo.Models;
using AudioGo.Services.Interfaces;
using System.Text.Json;

namespace AudioGo.ViewModels
{
    [QueryProperty(nameof(PoiId), "poiId")]
    public class PoiDetailViewModel : BaseViewModel
    {
        private readonly AppDatabase _db;
        private readonly IAudioService _audio;

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
                OnPropertyChanged(nameof(CategoryTag));
                OnPropertyChanged(nameof(HeroImageUrl));
                OnPropertyChanged(nameof(GalleryImages));
                OnPropertyChanged(nameof(HasGallery));
                OnPropertyChanged(nameof(GalleryCount));
            }
        }

        // ── Computed POI properties ────────────────────────────────
        public string Title => _poi?.Title ?? string.Empty;
        public string Description => _poi?.Description ?? string.Empty;
        public string HeroImageUrl => _poi?.LogoUrl ?? string.Empty;

        public string CategoryTag
        {
            get
            {
                if (_poi is null || string.IsNullOrEmpty(_poi.CategoriesJson)) return string.Empty;
                try
                {
                    var cats = JsonSerializer.Deserialize<List<string>>(_poi.CategoriesJson);
                    return cats?.FirstOrDefault() ?? string.Empty;
                }
                catch { return string.Empty; }
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
                    // Prepend LogoUrl as first gallery image if not already included
                    if (!string.IsNullOrEmpty(_poi.LogoUrl) && !urls.Contains(_poi.LogoUrl))
                        return [_poi.LogoUrl, .. urls];
                    return urls;
                }
                catch { return []; }
            }
        }

        public bool HasGallery => GalleryImages.Count > 0;
        public string GalleryCount => GalleryImages.Count > 0 ? $"{GalleryImages.Count} ảnh" : "";

        // ── Language selector ──────────────────────────────────────
        public List<LanguageOption> Languages { get; } =
        [
            new("🇻🇳 Tiếng Việt",   "vi"),
            new("🇺🇸 English",       "en"),
            new("🇨🇳 中文",           "zh-Hans"),
            new("🇰🇷 한국어",          "ko"),
            new("🇯🇵 日本語",          "ja"),
            new("🇫🇷 Français",       "fr"),
            new("🇩🇪 Deutsch",        "de"),
        ];

        private LanguageOption _selectedLanguage;
        public LanguageOption SelectedLanguage
        {
            get => _selectedLanguage;
            set
            {
                if (SetProperty(ref _selectedLanguage, value))
                    _ = ReloadForLanguageAsync(value.Code);
            }
        }

        // ── Description expand/collapse ────────────────────────────
        private bool _descExpanded;
        public bool DescExpanded
        {
            get => _descExpanded;
            set
            {
                SetProperty(ref _descExpanded, value);
                OnPropertyChanged(nameof(ExpandLabel));
            }
        }
        public string ExpandLabel => _descExpanded ? "Thu gọn ▲" : "Xem thêm ▼";

        // ── Audio state ────────────────────────────────────────────
        public bool IsPlaying => _audio.IsPlaying;
        public string PlayPauseIcon => _audio.IsPlaying ? "&#xe034;" : "&#xe037;";

        private double _audioProgress;
        public double AudioProgress
        {
            get => _audioProgress;
            set { SetProperty(ref _audioProgress, value); }
        }

        private string _currentTime = "0:00";
        public string CurrentTime
        {
            get => _currentTime;
            private set { SetProperty(ref _currentTime, value); }
        }

        private string _totalTime = "0:00";
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
        private int _speedIndex = 1; // default 1×

        // ── Gallery selected image ─────────────────────────────────
        private int _selectedGalleryIndex;
        public int SelectedGalleryIndex
        {
            get => _selectedGalleryIndex;
            set { SetProperty(ref _selectedGalleryIndex, value); }
        }

        // ── Error state ────────────────────────────────────────────
        private string _errorMessage = string.Empty;
        public string ErrorMessage
        {
            get => _errorMessage;
            private set { SetProperty(ref _errorMessage, value); }
        }

        // ── Constructor ────────────────────────────────────────────
        public PoiDetailViewModel(AppDatabase db, IAudioService audio)
        {
            _db = db;
            _audio = audio;
            _selectedLanguage = Languages.First(); // default vi
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
                    ErrorMessage = "Không tìm thấy điểm tham quan.";
                else
                {
                    // Sync selected language to loaded POI language
                    var matchLang = Languages.FirstOrDefault(l => l.Code == Poi.LanguageCode);
                    if (matchLang is not null)
                        _selectedLanguage = matchLang;
                    OnPropertyChanged(nameof(SelectedLanguage));
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

        private async Task ReloadForLanguageAsync(string langCode)
        {
            // Re-fetch POI with new language from DB (if synced) or trigger API call
            if (string.IsNullOrWhiteSpace(_poiId)) return;
            IsLoading = true;
            try
            {
                // Try loading from local cache first (same PoiId, different lang would be cached)
                var entity = await _db.GetPoiAsync(_poiId);
                if (entity is not null)
                {
                    entity.LanguageCode = langCode; // update display lang
                    Poi = entity;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[PoiDetailVM] ReloadLang error: {ex.Message}");
            }
            finally
            {
                IsLoading = false;
            }
        }

        // ── Audio controls ─────────────────────────────────────────
        public async Task TogglePlayPauseAsync()
        {
            if (IsPlaying)
                await StopAudioAsync();
            else
                await PlayAudioAsync();
        }

        public async Task PlayAudioAsync()
        {
            if (Poi is null) return;

            // Priority: local cached file → remote URL → TTS
            if (!string.IsNullOrEmpty(Poi.LocalAudioPath) && File.Exists(Poi.LocalAudioPath))
                await _audio.PlayFileAsync(Poi.LocalAudioPath);
            else if (!string.IsNullOrEmpty(Poi.AudioUrl))
                await _audio.PlayFileAsync(Poi.AudioUrl);
            else if (!string.IsNullOrEmpty(Poi.Description))
                await _audio.SpeakAsync(Poi.Description, Poi.LanguageCode);

            OnPropertyChanged(nameof(IsPlaying));
            OnPropertyChanged(nameof(PlayPauseIcon));
        }

        public async Task StopAudioAsync()
        {
            await _audio.StopAsync();
            OnPropertyChanged(nameof(IsPlaying));
            OnPropertyChanged(nameof(PlayPauseIcon));
        }

        public void CycleSpeed()
        {
            _speedIndex = (_speedIndex + 1) % _speeds.Length;
            SpeedText = _speeds[_speedIndex] == 1f ? "1×" : $"{_speeds[_speedIndex]}×";
        }

        public void ToggleDescExpanded() => DescExpanded = !DescExpanded;
    }

    public record LanguageOption(string DisplayName, string Code);
}
