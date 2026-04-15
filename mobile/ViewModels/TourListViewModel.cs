using AudioGo.Services.Interfaces;
using AudioGo.ViewModels;
using Shared.DTOs;
using System.Collections.ObjectModel;
using System.Net.Http.Json;
using System.Windows.Input;

namespace AudioGo.ViewModels
{
    public class TourListViewModel : BaseViewModel
    {
        private readonly IApiService _api;

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
        public string LabelEmptyDesc => AudioGo.Helpers.AppStrings.Get("tour_list_empty_desc");
        public string LabelCreateBtn => "+ " + AudioGo.Helpers.AppStrings.Get("tour_list_create_btn");

        public ICommand OpenTourCommand { get; }
        public ICommand RefreshCommand { get; }
        public ICommand ContinueTourCommand { get; }

        public async Task DeleteTourAsync(string tourId)
        {
            try
            {
                // TODO: gọi API xóa tour khi endpoint sẵn sàng
                var found = _allTours.FirstOrDefault(t => t.TourId == tourId);
                if (found != null)
                {
                    _allTours.Remove(found);
                    FilterTours(SearchText);
                    OnPropertyChanged(nameof(HasTours));
                    OnPropertyChanged(nameof(IsEmpty));
                }
            }
            catch { /* silent */ }
        }

        public TourListViewModel(IApiService api)
        {
            _api = api;

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

        public async Task LoadToursAsync(string lang = "vi")
        {
            IsLoading = true;
            try
            {
                var result = await _api.GetToursAsync(languageCode: lang);

                _allTours = result?.Select(t => new TourRowVm(t)).ToList() ?? new();
                FilterTours(SearchText);
            }
            catch
            {
                // Fallback: giữ danh sách mock nếu API chưa chạy
                if (_allTours.Count == 0)
                    LoadMockData();
            }
            finally
            {
                IsLoading = false;
                OnPropertyChanged(nameof(HasTours));
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
        }

        private void LoadMockData()
        {
            _allTours = new List<TourRowVm>
            {
                new TourRowVm(new TourSummaryDto("mock-1", "Tour Hải Sản Vĩnh Khánh",
                    "Khám phá tinh hoa ẩm thực hải sản nổi tiếng ở khu phố Vĩnh Khánh.",
                    8, "tour_mock1.jpg", DateTime.Today)),
                new TourRowVm(new TourSummaryDto("mock-2", "Vĩnh Khánh — Ký Ức Phố Cảng",
                    "Hành trình ngược thời gian về lịch sử hình thành khu phố Vĩnh Khánh.",
                    12, "tour_mock2.jpg", DateTime.Today)),
            };
            FilterTours(SearchText);
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
        public string LabelPoints => AudioGo.Helpers.AppStrings.Get("tour_points");
        public string LabelMinutes => AudioGo.Helpers.AppStrings.Get("tour_minutes");
        public string LabelLang => AudioGo.Helpers.AppStrings.Get("tour_lang");
        public string LabelContinue => "▶  " + AudioGo.Helpers.AppStrings.Get("tour_continue");

        // Duration & language — not in DTO yet, show placeholder
        public string DurationText  => "--";
        public string Language      => "VI";
        // Progress — no real data yet, keep at 0
        public string ProgressText  => $"0/{_dto.PoiCount}";
        public double ProgressRatio => 0d;
    }
}
