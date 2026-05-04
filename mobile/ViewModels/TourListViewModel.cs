using AudioGo.Services.Interfaces;
using AudioGo.ViewModels;
using Shared.DTOs;
using System.Collections.ObjectModel;
using System.Net.Http.Json;
using System.Windows.Input;
using AudioGo.Services;

namespace AudioGo.ViewModels
{
    public class TourListViewModel : BaseViewModel
    {
        private readonly SyncService _sync;

        // Override setter to also notify HasTours when loading changes
        public new bool IsLoading
        {
            get => base.IsLoading;
            set { base.IsLoading = value; OnPropertyChanged(nameof(HasTours)); }
        }

        private string _searchText = string.Empty;
        public string SearchText
        {
            get => _searchText;
            set { SetProperty(ref _searchText, value); FilterTours(value); }
        }

        private List<TourRowVm> _allTours = new();
        public ObservableCollection<TourRowVm> Tours { get; } = new();

        public bool HasTours => !IsLoading && Tours.Count > 0;
        public bool IsEmpty => !IsLoading && Tours.Count == 0;
        public string CountLabel => AudioGo.Helpers.AppStrings.Get("tour_list_count", Tours.Count);

        // UI Strings
        public string LabelTours => AudioGo.Helpers.AppStrings.Get("tour_list_tours");
        public string LabelEmptyTitle => AudioGo.Helpers.AppStrings.Get("tour_list_empty_title");
        public string LabelEmptyDesc => AudioGo.Helpers.AppStrings.Get("tour_list_empty_desc_mobile");

        public ICommand OpenTourCommand { get; }
        public ICommand RefreshCommand { get; }
        public ICommand ContinueTourCommand { get; }


        public TourListViewModel(SyncService sync)
        {
            _sync = sync;
            
            _sync.LanguageChanged += (_, _) => RefreshLocalization();

            OpenTourCommand = new Command<TourRowVm>(async tour =>
            {
                if (tour != null)
                    await Shell.Current.GoToAsync($"{nameof(AudioGo_Mobile.Views.TourDetailPage)}?tourId={tour.TourId}");
            });

            ContinueTourCommand = new Command<TourRowVm>(async tour =>
            {
                if (tour != null)
                    await Shell.Current.GoToAsync($"{nameof(AudioGo_Mobile.Views.TourDetailPage)}?tourId={tour.TourId}");
            });

            RefreshCommand = new Command(async () => await LoadToursAsync());
        }

        private void RefreshLocalization()
        {
            OnPropertyChanged(nameof(LabelTours));
            OnPropertyChanged(nameof(LabelEmptyTitle));
            OnPropertyChanged(nameof(LabelEmptyDesc));
            OnPropertyChanged(nameof(CountLabel));
            
            // Reload if we want tours to refresh language
            _ = LoadToursAsync();
        }

        public async Task LoadToursAsync()
        {
            IsLoading = true;
            try
            {
                var lang = AudioGo.Helpers.AppSettings.GetAppLanguage();
                var result = await _sync.GetToursAsync(languageCode: lang);
                _allTours = result?.Select(t => new TourRowVm(t)).ToList() ?? new();
                FilterTours(SearchText);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[TourList] Load failed: {ex.Message}");
                // Giữ dữ liệu cũ nếu đã có, không mock
            }
            finally
            {
                IsLoading = false;
                OnPropertyChanged(nameof(HasTours));
                OnPropertyChanged(nameof(IsEmpty));
                OnPropertyChanged(nameof(CountLabel));
            }
        }

        private void FilterTours(string query)
        {
            Tours.Clear();
            var filtered = string.IsNullOrWhiteSpace(query)
                ? _allTours
                : _allTours.Where(t => t.Name.Contains(query, StringComparison.OrdinalIgnoreCase));

            foreach (var t in filtered)
                Tours.Add(t);

            // Notify các computed props phụ thuộc Tours.Count
            OnPropertyChanged(nameof(HasTours));
            OnPropertyChanged(nameof(IsEmpty));
            OnPropertyChanged(nameof(CountLabel));
        }

    }

    /// <summary>Row VM cho CollectionView (có computed labels).</summary>
    public class TourRowVm
    {
        private readonly TourSummaryDto _dto;

        public TourRowVm(TourSummaryDto dto) => _dto = dto;

        public string  TourId        => _dto.TourId;
        public string  Name          => _dto.Name;
        public string  Description   => _dto.Description;
        public string? ThumbnailUrl  => _dto.ThumbnailUrl;
        public string  CreatedAtLabel => _dto.CreatedAt.ToString("dd/MM/yyyy");

        // Properties used by TourListPage XAML
        public int    PoiCount      => _dto.PoiCount;
        
        public string LabelProgress => AudioGo.Helpers.AppStrings.Get("tour_progress");
        public string LabelPoints   => AudioGo.Helpers.AppStrings.Get("tour_points");
        public string LabelWalk     => AudioGo.Helpers.AppStrings.Get("tour_walk");
        public string LabelLang     => AudioGo.Helpers.AppStrings.Get("tour_lang");
        public string LabelContinue => "▶  " + AudioGo.Helpers.AppStrings.Get("tour_continue");

        // Walk time: tính Haversine giữa các POI theo thứ tự — ô bình thường 4 km/h
        // Tạm dùng PoiCount * 8 phút/POI (bao gồm cả nghe + đi lại) đến khi có toạ độ đầy đủ từ API detail
        public string DurationText  => $"{_dto.PoiCount * 8}";
        public string Language      => "VI";
        // Progress — no real data yet, keep at 0
        public string ProgressText  => $"0/{_dto.PoiCount}";
        public double ProgressRatio => 0d;
    }
}
