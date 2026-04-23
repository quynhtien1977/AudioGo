using System.Collections.ObjectModel;

namespace AudioGo.ViewModels
{
    [QueryProperty(nameof(TourId), "tourId")]
    public class TourDetailViewModel : BaseViewModel
    {
        // ── Query parameter ──────────────────────────────────────────
        private string _tourId = string.Empty;
        public string? TourId
        {
            get => _tourId;
            set
            {
                SetProperty(ref _tourId, value ?? string.Empty);
                if (!string.IsNullOrEmpty(value))
                    Task.Run(() => LoadAsync(value));
            }
        }

        // ── Bindable properties ────────────────────────────────────
        private string _tourName = string.Empty;
        public string TourName
        {
            get => _tourName;
            private set => SetProperty(ref _tourName, value);
        }

        private string _thumbnailUrl = string.Empty;
        public string ThumbnailUrl
        {
            get => _thumbnailUrl;
            private set => SetProperty(ref _thumbnailUrl, value);
        }

        private string _description = string.Empty;
        public string Description
        {
            get => _description;
            private set => SetProperty(ref _description, value);
        }

        private string _errorMessage = string.Empty;
        public string ErrorMessage
        {
            get => _errorMessage;
            private set => SetProperty(ref _errorMessage, value);
        }

        private bool _isPlaying;
        public bool IsPlaying
        {
            get => _isPlaying;
            private set => SetProperty(ref _isPlaying, value);
        }

        public ObservableCollection<TourStepVm> Steps { get; } = new();

        // UI Strings
        public string LabelContinue => AudioGo.Helpers.AppStrings.Get("tour_detail_continue");
        public string LabelMap => AudioGo.Helpers.AppStrings.Get("tour_detail_map");
        public string LabelStopList => AudioGo.Helpers.AppStrings.Get("tour_detail_stop_list");

        // ── Load ───────────────────────────────────────────────────
        public async Task LoadAsync(string tourId)
        {
            if (IsLoading) return;
            IsLoading = true;
            ErrorMessage = string.Empty;

            try
            {
                // TODO: gọi ApiService.GetTourAsync(tourId) khi endpoint sẵn sàng
                await Task.Delay(300); // simulate network
                LoadMockData(tourId);
            }
            catch (Exception ex)
            {
                ErrorMessage = $"{AudioGo.Helpers.AppStrings.Get("tour_load_err")}: {ex.Message}";
                LoadMockData(tourId);
            }
            finally
            {
                IsLoading = false;
            }
        }

        // ── Audio controls ─────────────────────────────────────────
        public void TogglePlay() => IsPlaying = !IsPlaying;
        public void Stop()       => IsPlaying = false;

        // ── Mock fallback ──────────────────────────────────────────
        private void LoadMockData(string tourId)
        {
            TourName = tourId switch
            {
                "tour-1" => "Tour Ẩm Thực Vĩnh Khánh",
                "tour-2" => "Tour Hải Sản Quận 4",
                "tour-3" => "Tour Di Tích Lịch Sử",
                _        => "Tour Khám Phá Quận 4"
            };

            ThumbnailUrl = "tour_mock1.jpg";

            Description = "Khám phá hơn 20 điểm ẩm thực nổi tiếng tại phố Vĩnh Khánh, Quận 4.";

            Steps.Clear();
            Steps.Add(new TourStepVm("1", "Hải Sản Bã Tư",          "Hải sản tươi sống",          "~0 phút"));
            Steps.Add(new TourStepVm("2", "Bánh Canh Cua Bà Hai",    "Bánh canh cua đặc sản",      "~3 phút"));
            Steps.Add(new TourStepVm("3", "Ốc Đêm Vĩnh Khánh",      "Các loại ốc đặc sản",        "~5 phút"));
            Steps.Add(new TourStepVm("4", "Cà Phê Vĩnh Khánh",      "Cà phê sáng truyền thống",   "~8 phút"));
        }
    }

    /// <summary>Dữ liệu một điểm dừng trong tour.</summary>
    public class TourStepVm
    {
        public string StepNumber { get; }
        public string Title      { get; }
        public string Subtitle   { get; }
        public string TravelTime { get; }

        public TourStepVm(string stepNumber, string title, string subtitle, string travelTime)
        {
            StepNumber = stepNumber;
            Title      = title;
            Subtitle   = subtitle;
            TravelTime = travelTime;
        }
    }
}
