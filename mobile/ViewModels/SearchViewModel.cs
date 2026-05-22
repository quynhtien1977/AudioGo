using AudioGo.Services.Interfaces;
using AudioGo.Helpers;
using AudioGo_Mobile.Views;
using AudioGo.Services;
using AudioGo.Data;
using AudioGo.Models;
using AudioGo.Mobile.Models;
using Shared;
using Shared.DTOs;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Windows.Input;

namespace AudioGo.ViewModels
{
    // ── SearchPage Main ViewModel ──────────────────────────────────────
    [QueryProperty(nameof(IncomingCategoryId), "categoryId")]
    public class SearchViewModel : BaseViewModel
    {
        private readonly IApiService _api;
        private readonly SyncService _sync;
        private readonly AppDatabase _db;

        // Shadow base.IsLoading to also call UpdateStates
        public new bool IsLoading
        {
            get => base.IsLoading;
            set { base.IsLoading = value; UpdateStates(); }
        }

        // ── Article Collections & UI Helpers ──────────────────────
        public ObservableCollection<ArticleViewModel> NewsArticles { get; } = new();
        public ObservableCollection<ArticleViewModel> TipArticles { get; } = new();
        public bool ShowArticles => string.IsNullOrEmpty(Query);

        private string? _incomingCategoryId;
        public string? IncomingCategoryId
        {
            get => _incomingCategoryId;
            set
            {
                _incomingCategoryId = value;
                if (!string.IsNullOrEmpty(value))
                {
                    var targetValue = Uri.UnescapeDataString(value);
                    foreach (var c in CategoryChips)
                    {
                        c.IsActive = string.Equals(c.Value, targetValue, StringComparison.OrdinalIgnoreCase);
                    }
                    ActiveCategory = targetValue;
                }
            }
        }

        private string _query = string.Empty;
        public string Query
        {
            get => _query;
            set
            {
                if (SetProperty(ref _query, value))
                {
                    OnPropertyChanged(nameof(ShowArticles));
                    OnPropertyChanged(nameof(ShowNewsArticlesSection));
                    OnPropertyChanged(nameof(ShowTipArticlesSection));
                    _ = SearchAsync(value);
                }
            }
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
        public string PageTitle => AppStrings.Get("search_title");
        public string AreaSubtitle => AppStrings.Get("search_area_sub");
        public string SearchPlaceholder => AppStrings.Get("search_placeholder");
        public string WelcomeTitle => AppStrings.Get("search_welcome_title");
        public string WelcomeSubtitle => AppStrings.Get("search_welcome_subtitle");
        public string PoiSectionTitle => AppStrings.Get("search_section_poi");
        public string TourSectionTitle => AppStrings.Get("search_section_tour");
        public string NewsTitle => AppStrings.Get("news_title");
        public string TravelTipsTitle => AppStrings.Get("travel_tips_title");
        public string ViewAllLabel => AppStrings.Get("view_all_label");

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
        public ICommand OpenArticleCommand { get; }
        public ICommand ViewAllArticlesCommand { get; }

        public SearchViewModel(IApiService api, SyncService sync, AppDatabase db)
        {
            _api = api;
            _sync = sync;
            _db = db;

            // Start with default chips while API loads
            CategoryChips = new ObservableCollection<CategoryChipVm>(
                CategoryChipVm.GetDefaultChips().Select(c => new CategoryChipVm(c.label, c.value)));
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

            OpenTourCommand = new Command<TourSearchVm>(async vm =>
            {
                if (vm is null) return;
                await Shell.Current.GoToAsync($"{nameof(TourDetailPage)}?tourId={vm.TourId}");
            });

            OpenArticleCommand = new Command<ArticleViewModel>(async vm =>
            {
                if (vm is null) return;
                await Shell.Current.GoToAsync($"ArticleDetailPage?articleId={vm.ArticleId}");
            });

            ViewAllArticlesCommand = new Command<string>(async type =>
            {
                if (string.IsNullOrEmpty(type)) return;
                await Shell.Current.GoToAsync($"ArticleListPage?type={type}");
            });

            // Load articles and categories asynchronously
            _ = InitializeArticlesAsync();
            _ = LoadCategoriesAsync();

            _sync.LanguageChanged += OnLanguageChanged;
            // Khi delta sync cập nhật POI (ẩn/xóa) → re-query để SearchPage không giữ POI cũ
            _sync.PoisUpdated += OnPoisUpdated;
        }

        private void OnPoisUpdated(object? sender, EventArgs e)
        {
            // Chỉ re-query nếu đang hiển thị kết quả (tránh flicker khi ShowWelcome)
            if (!ShowWelcome)
                _ = SearchAsync(Query);
        }

        private void OnLanguageChanged(object? sender, string e)
        {
            OnPropertyChanged(nameof(PageTitle));
            OnPropertyChanged(nameof(AreaSubtitle));
            OnPropertyChanged(nameof(SearchPlaceholder));
            OnPropertyChanged(nameof(WelcomeTitle));
            OnPropertyChanged(nameof(WelcomeSubtitle));
            OnPropertyChanged(nameof(PoiSectionTitle));
            OnPropertyChanged(nameof(TourSectionTitle));
            OnPropertyChanged(nameof(NewsTitle));
            OnPropertyChanged(nameof(TravelTipsTitle));
            OnPropertyChanged(nameof(ViewAllLabel));
            _ = LoadCategoriesAsync();
            _ = InitializeArticlesAsync();
            Pois.Clear();
            Tours.Clear();
            Query = string.Empty;
            UpdateStates();
        }

        private async Task LoadCategoriesAsync()
        {
            try
            {
                var lang = AppSettings.GetAppLanguage();
                var apiCategories = await _sync.GetCategoriesAsync(lang);
                if (apiCategories.Count == 0) return;

                var newChips = CategoryChipVm.BuildFromApiCategories(apiCategories, lang);

                // Preserve active category if any, fallback to ActiveCategory (from incoming navigation)
                var currentActive = CategoryChips.FirstOrDefault(c => c.IsActive && !string.IsNullOrEmpty(c.Value))?.Value;
                if (string.IsNullOrEmpty(currentActive))
                    currentActive = ActiveCategory;

                await MainThread.InvokeOnMainThreadAsync(() =>
                {
                    CategoryChips.Clear();
                    foreach (var chip in newChips)
                    {
                        if (string.Equals(chip.Value, currentActive, StringComparison.OrdinalIgnoreCase))
                            chip.IsActive = true;
                        CategoryChips.Add(chip);
                    }
                    // Default activate first chip if nothing is active
                    if (!CategoryChips.Any(c => c.IsActive) && CategoryChips.Count > 0)
                    {
                        CategoryChips[0].IsActive = true;
                        ActiveCategory = CategoryChips[0].Value;
                    }
                    else if (CategoryChips.Any(c => c.IsActive))
                    {
                        ActiveCategory = CategoryChips.First(c => c.IsActive).Value;
                    }
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

                var allTours = await _sync.GetToursAsync(languageCode: lang);
                var filteredTours = allTours.Where(t => 
                    string.IsNullOrEmpty(query) || 
                    t.Name.Contains(query, StringComparison.OrdinalIgnoreCase) || 
                    (t.Description != null && t.Description.Contains(query, StringComparison.OrdinalIgnoreCase))
                );
                foreach (var t in filteredTours) Tours.Add(new TourSearchVm(t));
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

            var allTours = await _sync.GetToursAsync(languageCode: lang);
            var filteredTours = allTours.Where(t => 
                string.IsNullOrEmpty(query) || 
                t.Name.Contains(query, StringComparison.OrdinalIgnoreCase) || 
                (t.Description != null && t.Description.Contains(query, StringComparison.OrdinalIgnoreCase))
            );
            foreach (var t in filteredTours) Tours.Add(new TourSearchVm(t));
        }

        private string _emptyTitle = AppStrings.Get("search_empty_title");
        public string EmptyTitle { get => _emptyTitle; set => SetProperty(ref _emptyTitle, value); }
        
        private string _emptySubtitle = AppStrings.Get("search_empty_subtitle");
        public string EmptySubtitle { get => _emptySubtitle; set => SetProperty(ref _emptySubtitle, value); }

        private void UpdateStates()
        {
            HasResults  = Pois.Count > 0;
            HasTours    = Tours.Count > 0;
            
            bool isSearching = !string.IsNullOrEmpty(Query) || (!string.IsNullOrEmpty(ActiveCategory) && ActiveCategory != "all");
            
            IsEmpty     = !IsLoading && Pois.Count == 0 && Tours.Count == 0 && isSearching;
            ShowWelcome = !IsLoading && !isSearching && Pois.Count == 0 && Tours.Count == 0;

            // ── FIX: Cảnh báo rõ ràng nếu user search lúc mất mạng + chưa có cache ──
            if (!AudioGo.Helpers.NetworkHelper.HasInternet())
            {
                EmptyTitle = AppStrings.Get("search_offline_title");
                EmptySubtitle = AppStrings.Get("search_offline_subtitle");
            }
            else
            {
                EmptyTitle = AppStrings.Get("search_empty_title");
                EmptySubtitle = AppStrings.Get("search_empty_subtitle");
            }
        }

        // ── Articles Core Logic ──

        public bool HasNewsArticles => NewsArticles.Count > 0;
        public bool HasTipArticles => TipArticles.Count > 0;
        public bool ShowNewsArticlesSection => ShowArticles && HasNewsArticles;
        public bool ShowTipArticlesSection => ShowArticles && HasTipArticles;

        private void UpdateHasArticlesProperties()
        {
            OnPropertyChanged(nameof(HasNewsArticles));
            OnPropertyChanged(nameof(HasTipArticles));
            OnPropertyChanged(nameof(ShowNewsArticlesSection));
            OnPropertyChanged(nameof(ShowTipArticlesSection));
        }

        private async Task InitializeArticlesAsync()
        {
            string lang = AppSettings.GetAppLanguage();

            // Load local SQLite cache immediately to keep page loading instant
            await LoadArticlesLocalAsync("news", lang);
            await LoadArticlesLocalAsync("tip", lang);

            // Fetch and sync from server in background thread
            _ = Task.Run(async () =>
            {
                await SyncArticlesRemoteAsync("news", lang);
                await SyncArticlesRemoteAsync("tip", lang);
            });
        }

        private async Task LoadArticlesLocalAsync(string type, string lang)
        {
            int limit = type == "news" ? 3 : 5;
            var localEntities = await _db.GetArticlesByTypeAsync(type, lang, limit);

            await MainThread.InvokeOnMainThreadAsync(() =>
            {
                var collection = type == "news" ? NewsArticles : TipArticles;
                collection.Clear();
                foreach (var entity in localEntities)
                {
                    collection.Add(MapToViewModel(entity));
                }
                UpdateHasArticlesProperties();
            });
        }

        private async Task SyncArticlesRemoteAsync(string type, string lang)
        {
            try
            {
                if (!NetworkHelper.HasInternet()) return;

                int limit = type == "news" ? 3 : 5;
                var dtos = await _api.GetArticlesAsync(type, lang, limit);
                if (dtos == null || dtos.Count == 0) return;

                // Sync: clear current cache of this type & lang, then upsert
                await _db.ClearArticlesByTypeAsync(type, lang);
                foreach (var dto in dtos)
                {
                    await _db.UpsertArticleAsync(MapToEntity(dto, lang));
                }

                // Query from local SQLite again to maintain correct limit and ordering
                var refreshedEntities = await _db.GetArticlesByTypeAsync(type, lang, limit);

                await MainThread.InvokeOnMainThreadAsync(() =>
                {
                    var collection = type == "news" ? NewsArticles : TipArticles;
                    collection.Clear();
                    foreach (var entity in refreshedEntities)
                    {
                        collection.Add(MapToViewModel(entity));
                    }
                    UpdateHasArticlesProperties();
                });
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[SearchViewModel] SyncArticlesRemoteAsync error for type {type}: {ex.Message}");
            }
        }

        // ── Mapping Helpers ──

        private ArticleViewModel MapToViewModel(ArticleEntity entity)
        {
            return new ArticleViewModel
            {
                ArticleId = entity.ArticleId,
                Type = entity.Type,
                ImageUrl = entity.ImageUrl,
                Title = entity.Title,
                Summary = entity.Summary,
                Body = entity.Body,
                PublishedAt = entity.PublishedAt,
                Lang = entity.Lang
            };
        }

        private ArticleEntity MapToEntity(ArticleItemDto dto, string lang)
        {
            return new ArticleEntity
            {
                ArticleId = dto.ArticleId,
                Type = dto.Type,
                ImageUrl = dto.ImageUrl,
                Title = dto.Title,
                Summary = dto.Summary,
                Body = dto.Body,
                PublishedAt = dto.PublishedAt,
                Lang = lang,
                SyncedAt = DateTime.UtcNow
            };
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
        public string  CategoryLabel => _poi.Categories?.Count > 0
            ? AppStrings.TranslateCategory(_poi.Categories[0])
            : AppStrings.Get("search_section_poi");
    }

    public class TourSearchVm
    {
        private readonly TourSummaryDto _dto;
        public TourSearchVm(TourSummaryDto dto) => _dto = dto;

        public string  TourId        => _dto.TourId;
        public string  Name          => _dto.Name;
        public string? ThumbnailUrl  => _dto.ThumbnailUrl;
        public string  PoiCountLabel => $"📍 {_dto.PoiCount} {AppStrings.Get("tour_points")}";
    }
}
