using AudioGo.Services.Interfaces;
using AudioGo.Helpers;
using AudioGo_Mobile.Views;
using AudioGo.Services;
using Shared;
using Shared.DTOs;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Windows.Input;

namespace AudioGo.ViewModels
{
    // ── SearchPage Main ViewModel ──────────────────────────────────────
    public class SearchViewModel : BaseViewModel
    {
        private readonly IApiService _api;
        private readonly SyncService _sync;

        // Shadow base.IsLoading to also call UpdateStates
        public new bool IsLoading
        {
            get => base.IsLoading;
            set { base.IsLoading = value; UpdateStates(); }
        }

        private string _query = string.Empty;
        public string Query
        {
            get => _query;
            set { SetProperty(ref _query, value); _ = SearchAsync(value); }
        }

        // Alias used by some XAML bindings
        public string SearchQuery
        {
            get => _query;
            set => Query = value;
        }

        private string _activeCategory = string.Empty;
        public string ActiveCategory
        {
            get => _activeCategory;
            set { SetProperty(ref _activeCategory, value); _ = SearchAsync(Query); }
        }

        public ObservableCollection<PoiSearchVm>      Pois        { get; } = new();
        public ObservableCollection<TourSearchVm>     Tours       { get; } = new();
        public ObservableCollection<PoiSearchVm>      FilteredPois => Pois;
        public ObservableCollection<CategoryChipVm>   CategoryChips { get; }

        // Legacy string list kept for any leftover bindings
        public List<string> Categories { get; } = CategoryChipVm.GetDefaultChips().Select(c => c.label).ToList();

        private bool _hasResults;
        public bool HasResults { get => _hasResults; set => SetProperty(ref _hasResults, value); }

        private bool _hasTours;
        public bool HasTours { get => _hasTours; set => SetProperty(ref _hasTours, value); }

        private bool _isEmpty;
        public bool IsEmpty { get => _isEmpty; set => SetProperty(ref _isEmpty, value); }

        private bool _showWelcome = true;
        public bool ShowWelcome { get => _showWelcome; set => SetProperty(ref _showWelcome, value); }

        public ICommand FilterCommand  { get; }
        public ICommand OpenPoiCommand { get; }
        public ICommand OpenTourCommand { get; }

        public SearchViewModel(IApiService api, SyncService sync)
        {
            _api = api;
            _sync = sync;

            // Start with "All" chip while API loads
            CategoryChips = new ObservableCollection<CategoryChipVm>(
                CategoryChipVm.GetDefaultChips().Select(c => new CategoryChipVm(c.label, c.icon, c.value)));
            CategoryChips[0].IsActive = true;

            FilterCommand = new Command<CategoryChipVm>(chip =>
            {
                if (chip is null) return;
                foreach (var c in CategoryChips) c.IsActive = false;
                chip.IsActive    = true;
                ActiveCategory   = chip.Value;
            });

            OpenPoiCommand = new Command<PoiSearchVm>(async vm =>
            {
                if (vm is null) return;
                await Shell.Current.GoToAsync($"{nameof(PoiDetailPage)}?poiId={vm.PoiId}");
            });

            OpenTourCommand = new Command<TourSearchVm>(_ =>
            {
                // Tour tam an de ship som
            });

            // Load real categories from API asynchronously
            _ = LoadCategoriesAsync();

            _sync.LanguageChanged += OnLanguageChanged;
        }

        private void OnLanguageChanged(object? sender, string e)
        {
            _ = LoadCategoriesAsync();
            Pois.Clear();
            Tours.Clear();
            Query = string.Empty;
            UpdateStates();
        }

        private async Task LoadCategoriesAsync()
        {
            try
            {
                var apiCategories = await _sync.GetCategoriesAsync();
                if (apiCategories.Count == 0) return;

                var lang = AppSettings.GetAppLanguage();
                var newChips = CategoryChipVm.BuildFromApiCategories(apiCategories, lang);

                // Preserve active category if any
                var currentActive = CategoryChips.FirstOrDefault(c => c.IsActive)?.Value ?? "";

                await MainThread.InvokeOnMainThreadAsync(() =>
                {
                    CategoryChips.Clear();
                    foreach (var chip in newChips)
                    {
                        if (chip.Value == currentActive)
                            chip.IsActive = true;
                        CategoryChips.Add(chip);
                    }
                    // Default activate first chip if nothing is active
                    if (!CategoryChips.Any(c => c.IsActive) && CategoryChips.Count > 0)
                        CategoryChips[0].IsActive = true;
                });
            }
            catch
            {
                // Keep hardcoded defaults if API fails
            }
        }

        private CancellationTokenSource? _searchCts;

        private async Task SearchAsync(string query)
        {
            ShowWelcome = false;

            _searchCts?.Cancel();
            _searchCts = new CancellationTokenSource();
            var token = _searchCts.Token;

            // ── FIX: Bỏ chặn query 1 ký tự, cho phép search tự do offline/kể cả online nếu muốn ──
            // Xóa early return if (query.Length == 1) để offline search chạy bình thường


            try
            {
                await Task.Delay(300, token);
            }
            catch (TaskCanceledException)
            {
                return;
            }

            if (token.IsCancellationRequested) return;

            IsLoading = true;
            Pois.Clear();
            Tours.Clear();

            if (!AudioGo.Helpers.NetworkHelper.HasInternet())
            {
                await OfflineSearchAsync(query);
                IsLoading = false;
                UpdateStates();
                return;
            }

            try
            {
                string lang = AppSettings.GetAppLanguage();
                var pois = await _api.GetPoisAsync(languageCode: lang, query: query, category: ActiveCategory);
                if (pois is not null)
                    foreach (var p in pois) Pois.Add(new PoiSearchVm(p));

                // Tour tam an de ship som
            }
            catch 
            { 
                await OfflineSearchAsync(query);
            }
            finally
            {
                IsLoading = false;
                UpdateStates();
            }
        }

        private async Task OfflineSearchAsync(string query)
        {
            // ── FIX: Lấy language thiết bị để load đúng cache SQLite ngôn ngữ đang dùng ──
            string lang = AppSettings.GetAppLanguage();
            var allPois = await _sync.GetPoisAsync(lang);
            
            // ── FIX: Cải thiện filter (OrdinalIgnoreCase) và ưu tiên category 'all' ──
            var filtered = allPois.Where(p => 
                (string.IsNullOrEmpty(query) || p.Title?.Contains(query, StringComparison.OrdinalIgnoreCase) == true || p.Description?.Contains(query, StringComparison.OrdinalIgnoreCase) == true) &&
                (string.IsNullOrEmpty(ActiveCategory) || ActiveCategory == "all" || p.Categories?.Contains(ActiveCategory, StringComparer.OrdinalIgnoreCase) == true)
            );
            
            foreach (var p in filtered) Pois.Add(new PoiSearchVm(p));
        }

        private string _emptyTitle = "Không tìm thấy kết quả";
        public string EmptyTitle { get => _emptyTitle; set => SetProperty(ref _emptyTitle, value); }
        
        private string _emptySubtitle = "Thử tìm \"bún bò\", \"cà phê\", \"di tích\"...";
        public string EmptySubtitle { get => _emptySubtitle; set => SetProperty(ref _emptySubtitle, value); }

        private void UpdateStates()
        {
            HasResults  = Pois.Count > 0;
            HasTours    = false;
            
            bool isSearching = !string.IsNullOrEmpty(Query) || (!string.IsNullOrEmpty(ActiveCategory) && ActiveCategory != "all");
            
            IsEmpty     = !IsLoading && Pois.Count == 0 && Tours.Count == 0 && isSearching;
            ShowWelcome = !IsLoading && !isSearching && Pois.Count == 0 && Tours.Count == 0;

            // ── FIX: Cảnh báo rõ ràng nếu user search lúc mất mạng + chưa có cache ──
            if (!AudioGo.Helpers.NetworkHelper.HasInternet())
            {
                EmptyTitle = "Bạn đang ngoại tuyến";
                EmptySubtitle = "App chưa có dữ liệu điểm đến để tìm kiếm offline. Vui lòng thử lại khi có mạng.";
            } 
            else 
            {
                EmptyTitle = "Không tìm thấy kết quả";
                EmptySubtitle = "Thử tìm \"bún bò\", \"cà phê\", \"di tích\"...";
            }
        }
    }

    // ── DTOs for search result list items ─────────────────────────────
    public class PoiSearchVm
    {
        private readonly POI _poi;
        public PoiSearchVm(POI poi) => _poi = poi;

        public string  PoiId         => _poi.PoiId;
        public string  Title         => _poi.Title;
        public string? LogoUrl       => _poi.LogoUrl;
        public string  CategoryLabel => _poi.Categories?.Count > 0 ? _poi.Categories[0] : "Địa điểm";
    }

    public class TourSearchVm
    {
        private readonly TourSummaryDto _dto;
        public TourSearchVm(TourSummaryDto dto) => _dto = dto;

        public string  TourId        => _dto.TourId;
        public string  Name          => _dto.Name;
        public string? ThumbnailUrl  => _dto.ThumbnailUrl;
        public string  PoiCountLabel => $"📍 {_dto.PoiCount} điểm";
    }
}
