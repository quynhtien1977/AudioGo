using AudioGo.Services.Interfaces;
using Shared.DTOs;
using System.Collections.ObjectModel;
using AudioGo.Services;

namespace AudioGo.ViewModels
{
    [QueryProperty(nameof(TourId), "tourId")]
    public class TourDetailViewModel : BaseViewModel
    {
        private readonly SyncService _sync;
        private readonly ITourSessionManager _session;

        public TourDetailViewModel(SyncService sync, ITourSessionManager session)
        {
            _sync = sync;
            _session = session;

            _session.PoiVisited += OnPoiVisited;
            _session.SessionCompleted += OnSessionCompleted;

            // Khi user đổi dark/light mode → refresh CardBgColor của tất cả stops
            if (Application.Current is not null)
                Application.Current.RequestedThemeChanged += OnThemeChanged;
        }

        private void OnThemeChanged(object? sender, AppThemeChangedEventArgs e)
        {
            MainThread.BeginInvokeOnMainThread(() =>
            {
                foreach (var stop in Stops)
                    stop.NotifyCardBgColorChanged();
            });
        }

        // ── Query parameter ───────────────────────────────────────────
        private string _tourId = string.Empty;
        public string? TourId
        {
            get => _tourId;
            set => SetProperty(ref _tourId, value ?? string.Empty);
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
            private set
            {
                SetProperty(ref _description, value);
                OnPropertyChanged(nameof(HasDescription));
            }
        }

        public bool HasDescription => !string.IsNullOrWhiteSpace(Description);

        private string _errorMessage = string.Empty;
        public string ErrorMessage
        {
            get => _errorMessage;
            private set => SetProperty(ref _errorMessage, value);
        }

        // ── Stops collection ─────────────────────────────────────────
        public ObservableCollection<TourStepVm> Stops { get; } = new();

        // ── Progress ──────────────────────────────────────────────────
        private bool _isTourActive;
        public bool IsTourActive
        {
            get => _isTourActive;
            set => SetProperty(ref _isTourActive, value);
        }

        public string ProgressText =>
            _session.ActiveSession?.TourId == TourId
                ? AudioGo.Helpers.AppStrings.Get("tour_progress_format", _session.ActiveSession.VisitedCount, Stops.Count)
                : AudioGo.Helpers.AppStrings.Get("tour_progress_format", 0, Stops.Count);

        public double ProgressRatio =>
            Stops.Count > 0 && _session.ActiveSession?.TourId == TourId
                ? (double)_session.ActiveSession.VisitedCount / Stops.Count
                : 0d;

        private int _totalWalkMinutes = 0;
        public string TotalDuration =>
            _totalWalkMinutes > 0 ? AudioGo.Helpers.AppStrings.Get("map_walk_time", _totalWalkMinutes) : "--";

        // ── UI Strings ───────────────────────────────────────────────
        public string LabelContinue => AudioGo.Helpers.AppStrings.Get("tour_detail_continue");
        public string LabelStopList => AudioGo.Helpers.AppStrings.Get("tour_detail_stop_list");
        public string LabelOpenMap  => AudioGo.Helpers.AppStrings.Get("tour_detail_open_map");

        public string StartStopLabel => IsTourActive
            ? AudioGo.Helpers.AppStrings.Get("tour_stop")       // "Dừng Tour"
            : AudioGo.Helpers.AppStrings.Get("tour_start");     // "Khám phá"

        public string ResetLabel => AudioGo.Helpers.AppStrings.Get("tour_reset"); // "Bắt đầu lại"

        // ── Load từ API (không mock) ──────────────────────────────────
        public async Task LoadAsync(string tourId)
        {
            if (IsLoading || string.IsNullOrEmpty(tourId)) return;
            IsLoading    = true;
            ErrorMessage = string.Empty;

            try
            {
                var lang   = AudioGo.Helpers.AppSettings.GetAppLanguage();
                var detail = await _sync.GetTourDetailAsync(tourId, lang);

                if (detail is null)
                {
                    ErrorMessage = AudioGo.Helpers.AppStrings.Get("tour_load_err");
                    return;
                }

                TourName    = detail.Name;
                Description = detail.Description;

                Stops.Clear();
                var steps = detail.Steps.OrderBy(s => s.StepOrder).ToList();
                for (int i = 0; i < steps.Count; i++)
                {
                    int walkToNext = 0;
                    if (i < steps.Count - 1)
                        walkToNext = WalkMinutes(steps[i].Latitude, steps[i].Longitude,
                                                 steps[i + 1].Latitude, steps[i + 1].Longitude);

                    var stepVm = new TourStepVm(steps[i], isLast: i == steps.Count - 1, walkMinutesToNext: walkToNext);
                    
                    if (_session.ActiveSession?.TourId == tourId && _session.ActiveSession.VisitedPoiIds.Contains(steps[i].PoiId))
                    {
                        stepVm.IsVisited = true;
                    }

                    Stops.Add(stepVm);
                }

                if (_session.ActiveSession?.TourId == tourId)
                {
                    IsTourActive = true;
                    OnPropertyChanged(nameof(StartStopLabel));
                    OnPropertyChanged(nameof(ResetLabel));
                }

                _totalWalkMinutes = Stops.Sum(s => s.WalkMinutesToNext);

                OnPropertyChanged(nameof(ProgressText));
                OnPropertyChanged(nameof(ProgressRatio));
                OnPropertyChanged(nameof(TotalDuration));
            }
            catch (Exception ex)
            {
                ErrorMessage = $"{AudioGo.Helpers.AppStrings.Get("tour_load_err")}: {ex.Message}";
                #if DEBUG
                System.Diagnostics.Debug.WriteLine($"[TourDetail] Load failed: {ex.Message}");
                #endif
            }
            finally
            {
                IsLoading = false;
            }
        }

        // ── Haversine walk-time ───────────────────────────────────────
        private static int WalkMinutes(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371e3;
            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                  + Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180)
                  * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var dist = R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return Math.Max(1, (int)Math.Ceiling(dist / 66.67));
        }

        public void StartTour()
        {
            var orderedIds = Stops.OrderBy(s => s.StepOrder)
                                  .Select(s => s.PoiId)
                                  .ToList();
            _session.StartSession(TourId!, orderedIds);
            IsTourActive = true;
            OnPropertyChanged(nameof(StartStopLabel));
            OnPropertyChanged(nameof(ResetLabel));
            OnPropertyChanged(nameof(ProgressText));
            OnPropertyChanged(nameof(ProgressRatio));
        }

        public void StopTour()
        {
            _session.EndSession();
            IsTourActive = false;
            OnPropertyChanged(nameof(StartStopLabel));
            OnPropertyChanged(nameof(ResetLabel));
        }

        public void ResetTour()
        {
            _session.ResetSession();
            foreach (var stop in Stops)
                stop.IsVisited = false;
            MainThread.BeginInvokeOnMainThread(() =>
            {
                OnPropertyChanged(nameof(ProgressText));
                OnPropertyChanged(nameof(ProgressRatio));
            });
        }

        private void OnPoiVisited(object? sender, string poiId)
        {
            var step = Stops.FirstOrDefault(s => s.PoiId == poiId);
            if (step != null) step.IsVisited = true;

            MainThread.BeginInvokeOnMainThread(() =>
            {
                OnPropertyChanged(nameof(ProgressText));
                OnPropertyChanged(nameof(ProgressRatio));
            });
        }

        private void OnSessionCompleted(object? sender, EventArgs e)
        {
            MainThread.BeginInvokeOnMainThread(async () =>
            {
                if (Shell.Current != null)
                {
                    await Shell.Current.DisplayAlertAsync(
                        "🎉 " + AudioGo.Helpers.AppStrings.Get("completed"),
                        AudioGo.Helpers.AppStrings.Get("tour_completed_msg").Replace("{0}", Stops.Count.ToString()),
                        AudioGo.Helpers.AppStrings.Get("ok"));
                }
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────
    public class TourStepVm : CommunityToolkit.Mvvm.ComponentModel.ObservableObject
    {
        public string PoiId        { get; }
        public int    StepOrder    { get; }
        public string StepNumber   { get; }
        public string Title        { get; }
        public string Description  { get; }
        public string AudioUrl     { get; }
        public double Latitude     { get; }
        public double Longitude    { get; }
        public int    WalkMinutesToNext { get; }

        // Timeline styling
        public bool   IsNotLast    { get; }
        public string DurationLabel { get; }

        private bool _isVisited;
        public bool IsVisited
        {
            get => _isVisited;
            set
            {
                SetProperty(ref _isVisited, value);
                OnPropertyChanged(nameof(StatusColor));
                OnPropertyChanged(nameof(CardBgColor));
            }
        }

        public Color StatusColor => IsVisited ? Color.FromArgb("#4CAF50") : Color.FromArgb("#E53935");
        public Color CardBgColor
        {
            get
            {
                var isDark = Application.Current?.RequestedTheme == AppTheme.Dark
                          || Application.Current?.UserAppTheme == AppTheme.Dark;
                if (IsVisited)
                    return isDark ? Color.FromArgb("#1B2E1B") : Color.FromArgb("#F1F8E9");
                return isDark ? Color.FromArgb("#1C1C1E") : Colors.White;
            }
        }

        /// <summary>Gọi khi theme thay đổi để UI refresh màu card.</summary>
        public void NotifyCardBgColorChanged() => OnPropertyChanged(nameof(CardBgColor));

        // Constructor từ DTO (duy nhất — không có mock constructor)
        public TourStepVm(TourStepDto dto, bool isLast, int walkMinutesToNext = 0, string? baseUrl = null)
        {
            PoiId             = dto.PoiId;
            StepOrder         = dto.StepOrder;
            StepNumber        = dto.StepOrder.ToString();
            Title             = dto.Title;
            Description       = dto.Description;
            IsNotLast         = !isLast;
            Latitude          = dto.Latitude;
            Longitude         = dto.Longitude;
            WalkMinutesToNext = walkMinutesToNext;
            DurationLabel     = isLast ? "" : AudioGo.Helpers.AppStrings.Get("tour_next_walk", walkMinutesToNext);

            var au = dto.AudioUrl ?? string.Empty;
            AudioUrl = (!string.IsNullOrEmpty(baseUrl) && !au.StartsWith("http") && !string.IsNullOrEmpty(au))
                ? $"{baseUrl}/{au.TrimStart('/')}"
                : au;
        }
    }
}
