using AudioGo.Services.Interfaces;
using AudioGo.ViewModels;
using Shared;
using System.Collections.ObjectModel;
using System.Net.Http.Json;
using System.Windows.Input;

namespace AudioGo.ViewModels
{
    public class CreateTourViewModel : BaseViewModel
    {
        private readonly HttpClient _http;
        private readonly string _baseUrl = "http://10.0.2.2:5000/api/mobile";

        private string _tourName = string.Empty;
        public string TourName
        {
            get => _tourName;
            set => SetProperty(ref _tourName, value);
        }

        private string _description = string.Empty;
        public string Description
        {
            get => _description;
            set => SetProperty(ref _description, value);
        }

        private string _selectedVoice = "female";
        public string SelectedVoice
        {
            get => _selectedVoice;
            set => SetProperty(ref _selectedVoice, value);
        }

        public ObservableCollection<PoiStepVm> SelectedPois { get; } = new();
        public bool NoPoisSelected => SelectedPois.Count == 0;

        // XAML aliases
        public ObservableCollection<PoiStepVm> SelectedStops => SelectedPois;
        public string StopCountLabel => AudioGo.Helpers.AppStrings.Get("create_tour_stop_count", SelectedPois.Count);

        // Sub-UI labels
        public string LabelTitle => AudioGo.Helpers.AppStrings.Get("create_tour_title");
        public string LabelName => AudioGo.Helpers.AppStrings.Get("create_tour_name");
        public string LabelNamePh => AudioGo.Helpers.AppStrings.Get("create_tour_name_placeholder");
        public string LabelDesc => AudioGo.Helpers.AppStrings.Get("create_tour_desc");
        public string LabelDescPh => AudioGo.Helpers.AppStrings.Get("create_tour_desc_placeholder");
        public string LabelLang => AudioGo.Helpers.AppStrings.Get("create_tour_lang");
        public string LabelCat => AudioGo.Helpers.AppStrings.Get("create_tour_cat");
        public string LabelSort => AudioGo.Helpers.AppStrings.Get("create_tour_sort");
        public string LabelAddStop => AudioGo.Helpers.AppStrings.Get("create_tour_add_stop");
        public string LabelPreview => AudioGo.Helpers.AppStrings.Get("create_tour_preview");
        public string LabelSave => AudioGo.Helpers.AppStrings.Get("create_tour_save");

        public bool CanSave => !string.IsNullOrWhiteSpace(_tourName);

        public System.Windows.Input.ICommand RemoveStopCommand => new Command<PoiStepVm>(stop =>
        {
            if (stop != null) SelectedPois.Remove(stop);
            OnPropertyChanged(nameof(StopCountLabel));
            OnPropertyChanged(nameof(NoPoisSelected));
        });
        /// <summary>Tổng thời gian ước tính: 8 phút mỗi điểm + 5 phút đi bộ giữa các điểm.</summary>
        public string TotalTimeLabel
        {
            get
            {
                if (SelectedPois.Count == 0) return "0 phút";
                int mins = SelectedPois.Count * 8 + (SelectedPois.Count - 1) * 5;
                return mins >= 60
                    ? $"{mins / 60} giờ {mins % 60} phút"
                    : $"~{mins} phút";
            }
        }

        public ICommand SaveCommand      { get; }
        public ICommand PreviewCommand   { get; }
        public ICommand AddPoiCommand    { get; }
        public ICommand SetVoiceCommand  { get; }

        public CreateTourViewModel()
        {
            _http = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };

            SaveCommand = new Command(async () => await SaveTourAsync(),
                () => !string.IsNullOrWhiteSpace(TourName));

            SetVoiceCommand = new Command<string>(v =>
            {
                SelectedVoice = v ?? "female";
            });

            PreviewCommand = new Command(() =>
            {
                // TODO: mở preview page hiển thị tour trước khi lưu
            });

            AddPoiCommand = new Command(async () =>
            {
                // TODO: mở page chọn POI (SearchPage filter mode)
                // Tạm thời thêm mock POI để demo
                var mock = new PoiStepVm(
                    new Shared.POI
                    {
                        PoiId = Guid.NewGuid().ToString(),
                        Title = "POI mẫu"
                    },
                    SelectedPois.Count + 1);
                SelectedPois.Add(mock);
                OnPropertyChanged(nameof(NoPoisSelected));
            });

            SelectedPois.CollectionChanged += (_, _) =>
                OnPropertyChanged(nameof(NoPoisSelected));
        }

        private async Task SaveTourAsync()
        {
            if (string.IsNullOrWhiteSpace(TourName)) return;

            try
            {
                var request = new Shared.DTOs.TourCreateRequest(TourName, Description);
                var resp = await _http.PostAsJsonAsync($"{_baseUrl}/tours", request);
                if (resp.IsSuccessStatusCode)
                {
                    await Shell.Current.GoToAsync("..");
                }
                else
                {
                    var page = Application.Current?.Windows[0].Page;
                    if (page is not null)
                        await page.DisplayAlertAsync(
                            "Lỗi", "Không thể lưu tour. Vui lòng thử lại.", "OK");
                }
            }
            catch
            {
                var page = Application.Current?.Windows[0].Page;
                if (page is not null)
                    await page.DisplayAlertAsync(
                        "Offline", "Không có kết nối. Tour sẽ được lưu cục bộ.", "OK");
            }
        }
    }

    public class PoiStepVm
    {
        private readonly Shared.POI _poi;

        public PoiStepVm(Shared.POI poi, int stepOrder)
        {
            _poi = poi;
            StepOrder = stepOrder;
        }

        public string PoiId        => _poi.PoiId;
        public string Title        => _poi.Title;
        public int StepOrder       { get; }
        public string CategoryLabel => _poi.Categories?.FirstOrDefault() ?? "Địa điểm";
    }
}
