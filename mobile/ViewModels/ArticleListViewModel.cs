using AudioGo.Services.Interfaces;
using AudioGo.Services;
using AudioGo.ViewModels;
using AudioGo.Mobile.Models;
using AudioGo.Models;
using AudioGo.Data;
using AudioGo.Helpers;
using System.Collections.ObjectModel;
using System.Windows.Input;

namespace AudioGo.ViewModels
{
    [QueryProperty(nameof(ArticleType), "type")]
    public class ArticleListViewModel : BaseViewModel
    {
        private readonly AppDatabase _db;
        private readonly IApiService _api;
        private readonly SyncService _sync;

        private string _articleType = "news";
        public string ArticleType
        {
            get => _articleType;
            set
            {
                if (SetProperty(ref _articleType, value))
                {
                    OnPropertyChanged(nameof(PageTitle));
                    _ = LoadArticlesAsync();
                }
            }
        }

        public string PageTitle => ArticleType == "news" ? AppStrings.Get("news_title") : AppStrings.Get("travel_tips_title");

        public ObservableCollection<ArticleViewModel> Articles { get; } = new();

        public bool HasArticles => !IsLoading && Articles.Count > 0;
        public bool IsEmpty => !IsLoading && Articles.Count == 0;

        public ICommand OpenArticleCommand { get; }
        public ICommand RefreshCommand { get; }
        public ICommand GoBackCommand { get; }

        public ArticleListViewModel(AppDatabase db, IApiService api, SyncService sync)
        {
            _db = db;
            _api = api;
            _sync = sync;

            _sync.LanguageChanged += OnLanguageChanged;

            OpenArticleCommand = new Command<ArticleViewModel>(async vm =>
            {
                if (vm is null) return;
                await Shell.Current.GoToAsync($"ArticleDetailPage?articleId={vm.ArticleId}");
            });

            RefreshCommand = new Command(async () => await SyncArticlesRemoteAsync());

            GoBackCommand = new Command(async () => await Shell.Current.GoToAsync(".."));
        }

        private void OnLanguageChanged(object? sender, string e)
        {
            OnPropertyChanged(nameof(PageTitle));
            _ = LoadArticlesAsync();
        }

        public async Task LoadArticlesAsync()
        {
            IsLoading = true;
            try
            {
                string lang = AppSettings.GetAppLanguage();
                // Get all cached articles of this type (limit 100 or unlimited)
                var local = await _db.GetArticlesByTypeAsync(ArticleType, lang, 100);
                
                Articles.Clear();
                foreach (var entity in local)
                {
                    Articles.Add(new ArticleViewModel
                    {
                        ArticleId = entity.ArticleId,
                        Type = entity.Type,
                        ImageUrl = entity.ImageUrl,
                        Title = entity.Title,
                        Summary = entity.Summary,
                        Body = entity.Body,
                        PublishedAt = entity.PublishedAt,
                        Lang = entity.Lang
                    });
                }
                OnPropertyChanged(nameof(HasArticles));
                OnPropertyChanged(nameof(IsEmpty));

                // Background sync
                _ = SyncArticlesRemoteAsync();
            }
            finally
            {
                IsLoading = false;
            }
        }

        private async Task SyncArticlesRemoteAsync()
        {
            try
            {
                if (!NetworkHelper.HasInternet()) return;

                string lang = AppSettings.GetAppLanguage();
                var dtos = await _api.GetArticlesAsync(ArticleType, lang, 100);
                if (dtos == null || dtos.Count == 0) return;

                await _db.ClearArticlesByTypeAsync(ArticleType, lang);
                foreach (var dto in dtos)
                {
                    await _db.UpsertArticleAsync(new ArticleEntity
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
                    });
                }

                var refreshed = await _db.GetArticlesByTypeAsync(ArticleType, lang, 100);
                await MainThread.InvokeOnMainThreadAsync(() =>
                {
                    Articles.Clear();
                    foreach (var entity in refreshed)
                    {
                        Articles.Add(new ArticleViewModel
                        {
                            ArticleId = entity.ArticleId,
                            Type = entity.Type,
                            ImageUrl = entity.ImageUrl,
                            Title = entity.Title,
                            Summary = entity.Summary,
                            Body = entity.Body,
                            PublishedAt = entity.PublishedAt,
                            Lang = entity.Lang
                        });
                    }
                    OnPropertyChanged(nameof(HasArticles));
                    OnPropertyChanged(nameof(IsEmpty));
                });
            }
            catch (Exception ex)
            {
                #if DEBUG
                System.Diagnostics.Debug.WriteLine($"[ArticleListViewModel] Sync failed: {ex.Message}");
                #endif
            }
        }
    }
}
