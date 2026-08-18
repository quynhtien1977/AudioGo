using AudioGo.Services.Interfaces;
using AudioGo.ViewModels;
using AudioGo.Mobile.Models;
using AudioGo.Data;
using AudioGo.Models;
using AudioGo.Helpers;
using System.Windows.Input;

namespace AudioGo.ViewModels
{
    [QueryProperty(nameof(ArticleId), "articleId")]
    public class ArticleDetailViewModel : BaseViewModel
    {
        private readonly AppDatabase _db;
        private readonly IApiService _api;

        private string _articleId = string.Empty;
        public string ArticleId
        {
            get => _articleId;
            set
            {
                if (SetProperty(ref _articleId, value))
                {
                    MainThread.BeginInvokeOnMainThread(async () =>
                    {
                        await LoadArticleAsync(value);
                    });
                }
            }
        }

        private ArticleViewModel? _article;
        public ArticleViewModel? Article
        {
            get => _article;
            private set
            {
                SetProperty(ref _article, value);
                OnPropertyChanged(nameof(Title));
                OnPropertyChanged(nameof(Summary));
                OnPropertyChanged(nameof(Body));
                OnPropertyChanged(nameof(HeroImageUrl));
                OnPropertyChanged(nameof(TypeEmoji));
                OnPropertyChanged(nameof(TypeDisplayName));
                OnPropertyChanged(nameof(TypeColorHex));
                OnPropertyChanged(nameof(DateDisplay));
                OnPropertyChanged(nameof(HasImage));
            }
        }

        // ── Computed Properties for XAML Bindings ──────────────────
        public string Title => _article?.Title ?? string.Empty;
        public string Summary => _article?.Summary ?? string.Empty;
        public string Body => _article?.Body ?? string.Empty;
        public string HeroImageUrl => _article?.ImageUrl ?? string.Empty;
        public string TypeEmoji => _article?.TypeEmoji ?? "📝";
        public string TypeDisplayName => _article?.TypeDisplayName ?? "Bài viết";
        public string TypeColorHex => _article?.TypeColorHex ?? "#9E9E9E";
        public string DateDisplay => _article?.DateDisplay ?? string.Empty;
        public bool HasImage => _article?.HasImage ?? false;

        public ICommand GoBackCommand { get; }

        public ArticleDetailViewModel(AppDatabase db, IApiService api)
        {
            _db = db;
            _api = api;

            GoBackCommand = new Command(async () => await Shell.Current.GoToAsync(".."));
        }

        private async Task LoadArticleAsync(string articleId)
        {
            if (string.IsNullOrWhiteSpace(articleId)) return;

            IsLoading = true;
            try
            {
                string lang = AppSettings.GetAppLanguage();
                
                // 1. Get from local cache
                var local = await _db.GetArticleAsync(articleId);
                if (local != null)
                {
                    Article = new ArticleViewModel
                    {
                        ArticleId = local.ArticleId,
                        Type = local.Type,
                        ImageUrl = local.ImageUrl,
                        Title = local.Title,
                        Summary = local.Summary,
                        Body = local.Body,
                        PublishedAt = local.PublishedAt,
                        Lang = local.Lang
                    };
                }

                // 2. Fetch full body from remote if not cached or body is empty
                if (local == null || string.IsNullOrWhiteSpace(local.Body))
                {
                    if (NetworkHelper.HasInternet())
                    {
                        var dto = await _api.GetArticleDetailAsync(articleId, lang);
                        if (dto != null)
                        {
                            // Update sqlite cache (upsert)
                            var entityToCache = new ArticleEntity
                            {
                                ArticleId = dto.ArticleId,
                                Type = dto.Type,
                                ImageUrl = dto.ImageUrl,
                                Title = dto.Title,
                                Summary = dto.Summary,
                                Body = dto.Body, // has full text body
                                PublishedAt = dto.PublishedAt,
                                Lang = lang,
                                SyncedAt = DateTime.UtcNow
                            };
                            await _db.UpsertArticleAsync(entityToCache);

                            await MainThread.InvokeOnMainThreadAsync(() =>
                            {
                                Article = new ArticleViewModel
                                {
                                    ArticleId = dto.ArticleId,
                                    Type = dto.Type,
                                    ImageUrl = dto.ImageUrl,
                                    Title = dto.Title,
                                    Summary = dto.Summary,
                                    Body = dto.Body,
                                    PublishedAt = dto.PublishedAt,
                                    Lang = lang
                                };
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                #if DEBUG
                System.Diagnostics.Debug.WriteLine($"[ArticleDetailViewModel] Load failed: {ex.Message}");
                #endif
            }
            finally
            {
                IsLoading = false;
            }
        }
    }
}
