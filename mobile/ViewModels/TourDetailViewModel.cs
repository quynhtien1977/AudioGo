using AudioGo.Services.Interfaces;
using Microsoft.Maui.Maps;
using Shared.DTOs;
using System.Collections.ObjectModel;
using System.Windows.Input;

namespace AudioGo.ViewModels
{
    [QueryProperty(nameof(TourId), "tourId")]
    public class TourDetailViewModel : BaseViewModel
    {
        private readonly IApiService _api;

        public TourDetailViewModel(IApiService api)
        {
            _api = api;
            OpenStopCommand = new Command<TourStepVm>(OnOpenStop);
        }

        // ── Query parameter ───────────────────────────────────────────
        private string _tourId = string.Empty;
        public string? TourId
        {
            get => _tourId;
            set => SetProperty(ref _tourId, value ?? string.Empty);
            // Không auto-load ở đây — OnAppearing của View gọi LoadAsync
        }

        // ── Bindable properties ──────────────────────────────────────
        private string _tourName = string.Empty;
        public string TourName
        {
            get => _tourName;
            private set => SetProperty(ref _tourName, value);
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

        // ── Stops collection ─────────────────────────────────────────
        public ObservableCollection<TourStepVm> Stops { get; } = new();

        // ── Progress (placeholder — tracking sẽ làm sprint sau) ──────
        public string ProgressText  => $"0/{Stops.Count} điểm";
        public double ProgressRatio => 0d;
        public string TotalDuration => "--";

        // ── Audio player (placeholder — audio integration sprint sau) ─
        public bool   IsAudioActive    => false;
        public string CurrentStopTitle => string.Empty;
        public string AudioTimeDisplay => "0:00";
        public string PlayPauseIcon    => "\ue037";  // play_arrow Material

        // ── Commands ─────────────────────────────────────────────────
        public ICommand OpenStopCommand { get; }

        private void OnOpenStop(TourStepVm? stop)
        {
            if (stop is null) return;
            // Placeholder — audio integration sprint sau
            System.Diagnostics.Debug.WriteLine($"[TourDetail] Open stop: {stop.Title}");
        }

        // ── UI Strings ───────────────────────────────────────────────
        public string LabelContinue => AudioGo.Helpers.AppStrings.Get("tour_detail_continue");
        public string LabelMap      => AudioGo.Helpers.AppStrings.Get("tour_detail_map");
        public string LabelStopList => AudioGo.Helpers.AppStrings.Get("tour_detail_stop_list");

        // ── Load ─────────────────────────────────────────────────────
        public async Task LoadAsync(string tourId)
        {
            if (IsLoading || string.IsNullOrEmpty(tourId)) return;
            IsLoading    = true;
            ErrorMessage = string.Empty;

            try
            {
                var lang   = AudioGo.Helpers.AppSettings.GetAppLanguage();
                var detail = await _api.GetTourByIdAsync(tourId, lang);

                if (detail is null)
                {
                    ErrorMessage = AudioGo.Helpers.AppStrings.Get("tour_load_err");
                    LoadMockData(tourId);
                    return;
                }

                TourName    = detail.Name;
                Description = detail.Description;

                Stops.Clear();
                var steps = detail.Steps.OrderBy(s => s.StepOrder).ToList();
                for (int i = 0; i < steps.Count; i++)
                    Stops.Add(new TourStepVm(steps[i], isLast: i == steps.Count - 1));

                OnPropertyChanged(nameof(ProgressText));
                OnPropertyChanged(nameof(ProgressRatio));
                OnPropertyChanged(nameof(TotalDuration));
            }
            catch (Exception ex)
            {
                ErrorMessage = $"{AudioGo.Helpers.AppStrings.Get("tour_load_err")}: {ex.Message}";
                if (Stops.Count == 0) LoadMockData(tourId);
            }
            finally
            {
                IsLoading = false;
            }
        }

        // ── Mock fallback (khi API lỗi / chưa có data) ───────────────
        private void LoadMockData(string tourId)
        {
            TourName = tourId switch
            {
                "tour-1" => "Tour Ẩm Thực Vĩnh Khánh",
                "tour-2" => "Tour Hải Sản Quận 4",
                "tour-3" => "Tour Di Tích Lịch Sử",
                _        => "Tour Khám Phá Quận 4"
            };
            Description = "Khám phá hơn 20 điểm ẩm thực nổi tiếng tại phố Vĩnh Khánh, Quận 4.";

            Stops.Clear();
            // Mock steps với tọa độ thật ở khu vực Quận 4 HCM
            Stops.Add(new TourStepVm("1", "Hải Sản Bã Tư",        "Hải sản tươi sống",       false, 10.763, 106.700, 1));
            Stops.Add(new TourStepVm("2", "Bánh Canh Cua Bà Hai", "Bánh canh cua đặc sản",   false, 10.762, 106.701, 2));
            Stops.Add(new TourStepVm("3", "Ốc Đêm Vĩnh Khánh",   "Các loại ốc đặc sản",     false, 10.761, 106.702, 3));
            Stops.Add(new TourStepVm("4", "Cà Phê Vĩnh Khánh",   "Cà phê sáng truyền thống", true,  10.760, 106.703, 4));

            OnPropertyChanged(nameof(ProgressText));
        }

        // Audio controls (placeholder)
        public void TogglePlay() { }
        public void Stop()       { }
    }

    /// <summary>Dữ liệu một điểm dừng trong tour — bind vào XAML CollectionView.</summary>
    public class TourStepVm
    {
        // ── Core data ──────────────────────────────────────────────
        public string  PoiId        { get; }
        public int     StepOrder    { get; }
        public string  StepNumber   { get; }   // "1", "2", ...
        public string  Title        { get; }
        public string  Description  { get; }
        public string  DurationLabel { get; } = "~-- phút";
        public string  AudioUrl     { get; }
        public double  Latitude     { get; }
        public double  Longitude    { get; }

        // ── XAML bindings (style + state) ─────────────────────────
        public bool   IsNotLast    { get; }
        public Color  StatusColor  { get; } = Colors.Gray;
        public string StatusIcon   { get; }   // số thứ tự hoặc icon
        public Color  CardBgColor  { get; } = Colors.White;
        public Color  PlayBgColor  { get; } = Color.FromArgb("#FFF0F5");
        public string PlayIcon     { get; } = "\ue037";   // play_arrow
        public Color  PlayIconColor { get; } = Color.FromArgb("#D15993");

        // ── Constructor từ DTO (API thật) ─────────────────────────
        public TourStepVm(TourStepDto dto, bool isLast, string? baseUrl = null)
        {
            PoiId       = dto.PoiId;
            StepOrder   = dto.StepOrder;
            StepNumber  = dto.StepOrder.ToString();
            Title       = dto.Title;
            Description = dto.Description;
            IsNotLast   = !isLast;
            StatusIcon  = dto.StepOrder.ToString();
            Latitude    = dto.Latitude;
            Longitude   = dto.Longitude;

            // Patch relative audio URL
            var au = dto.AudioUrl ?? string.Empty;
            AudioUrl = (!string.IsNullOrEmpty(baseUrl) && !au.StartsWith("http") && !string.IsNullOrEmpty(au))
                ? $"{baseUrl}/{au.TrimStart('/')}"
                : au;
        }

        // ── Constructor mock (fallback data) ──────────────────────
        public TourStepVm(string stepNumber, string title, string description,
                          bool isLast, double lat, double lon, int stepOrder)
        {
            PoiId       = $"mock-{stepOrder}";
            StepOrder   = stepOrder;
            StepNumber  = stepNumber;
            Title       = title;
            Description = description;
            IsNotLast   = !isLast;
            StatusIcon  = stepNumber;
            Latitude    = lat;
            Longitude   = lon;
            AudioUrl    = string.Empty;
        }
    }
}
