using AudioGo.Data;
using AudioGo.Models;
using AudioGo.Services.Interfaces;

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
            private set { SetProperty(ref _poi, value); }
        }



        private string _errorMessage = string.Empty;
        public string ErrorMessage
        {
            get => _errorMessage;
            private set { SetProperty(ref _errorMessage, value); }
        }

        // ── Audio state ────────────────────────────────────────────
        public bool IsPlaying => _audio.IsPlaying;

        private double _audioProgress = 0;
        public double AudioProgress
        {
            get => _audioProgress;
            set { SetProperty(ref _audioProgress, value); }
        }

        public async Task TogglePlayPauseAsync()
        {
            if (IsPlaying)
                await StopAudioAsync();
            else
                await PlayAudioAsync();
        }

        public PoiDetailViewModel(AppDatabase db, IAudioService audio)
        {
            _db = db;
            _audio = audio;
        }

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

        public async Task PlayAudioAsync()
        {
            if (Poi is null) return;

            if (!string.IsNullOrEmpty(Poi.AudioUrl))
                await _audio.PlayFileAsync(Poi.AudioUrl);
            else if (!string.IsNullOrEmpty(Poi.Description))
                await _audio.SpeakAsync(Poi.Description, Poi.LanguageCode);

            OnPropertyChanged(nameof(IsPlaying));
        }

        public async Task StopAudioAsync()
        {
            await _audio.StopAsync();
            OnPropertyChanged(nameof(IsPlaying));
        }
    }
}
