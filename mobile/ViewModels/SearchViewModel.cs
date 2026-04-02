using AudioGo.Services.Interfaces;
using AudioGo.ViewModels;
using Shared;
using System.Collections.ObjectModel;
using System.Net.Http.Json;
using System.Windows.Input;

namespace AudioGo.ViewModels
{
    public class SearchViewModel : BaseViewModel
    {
        private readonly IApiService _api;

        // Override setter to also call UpdateStates when loading changes
        public new bool IsLoading
        {
            get => base.IsLoading;
            set { base.IsLoading = value; UpdateStates(); }
        }

        private string _query = string.Empty;
        public string Query
        {
            get => _query;
            set { SetProperty(ref _query, value); Task.Run(() => SearchAsync(value)); }
        }

        private string _activeCategory = string.Empty;
        public string ActiveCategory
        {
            get => _activeCategory;
            set { SetProperty(ref _activeCategory, value); Task.Run(() => SearchAsync(Query)); }
        }

        public ObservableCollection<PoiSearchVm> Pois { get; } = new();
        public ObservableCollection<TourSearchVm> Tours { get; } = new();

        // XAML binding aliases
        public ObservableCollection<PoiSearchVm> FilteredPois => Pois;
        public string SearchQuery
        {
            get => _query;
            set => Query = value; // delegate to Query which triggers search
        }

        private bool _hasResults;
        public bool HasResults { get => _hasResults; set => SetProperty(ref _hasResults, value); }

        private bool _hasTours;
        public bool HasTours { get => _hasTours; set => SetProperty(ref _hasTours, value); }

        private bool _isEmpty = true;
        public bool IsEmpty { get => _isEmpty; set => SetProperty(ref _isEmpty, value); }

        public ICommand FilterCommand { get; }

        public SearchViewModel(IApiService api)
        {
            _api = api;
            FilterCommand = new Command<string>(cat =>
            {
                ActiveCategory = cat ?? string.Empty;
            });
        }

        private async Task SearchAsync(string query)
        {
            // Debounce: skip short queries
            if (query.Length == 1) return;

            IsLoading = true;
            Pois.Clear();
            Tours.Clear();

            try
            {
                // Gọi POI endpoint
                var pois = await _api.GetPoisAsync(languageCode: "vi", query: query, category: ActiveCategory);
                if (pois is not null)
                    foreach (var p in pois) Pois.Add(new PoiSearchVm(p));

                // Gọi Tours endpoint
                var tours = await _api.GetToursAsync(languageCode: "vi", query: query);
                if (tours is not null)
                    foreach (var t in tours) Tours.Add(new TourSearchVm(t));
            }
            catch
            {
                // API chưa sẵn — không hiện lỗi, chỉ để empty state
            }
            finally
            {
                IsLoading = false;
                UpdateStates();
            }
        }

        private void UpdateStates()
        {
            HasResults = Pois.Count > 0;
            HasTours = Tours.Count > 0;
            IsEmpty = !IsLoading && Pois.Count == 0 && Tours.Count == 0 && Query.Length > 1;
        }
    }

    public class PoiSearchVm
    {
        private readonly POI _poi;
        public PoiSearchVm(POI poi) => _poi = poi;

        public string Title       => _poi.Title;
        public string? LogoUrl    => _poi.LogoUrl;
        public string CategoryLabel
        {
            get
            {
                if (_poi.Categories?.Count > 0) return _poi.Categories[0];
                return "🏛️ Địa điểm";
            }
        }
    }

    public class TourSearchVm
    {
        private readonly Shared.DTOs.TourSummaryDto _dto;
        public TourSearchVm(Shared.DTOs.TourSummaryDto dto) => _dto = dto;

        public string TourId         => _dto.TourId;
        public string Name           => _dto.Name;
        public string? ThumbnailUrl  => _dto.ThumbnailUrl;
        public string PoiCountLabel  => $"📍 {_dto.PoiCount} điểm";
    }
}
