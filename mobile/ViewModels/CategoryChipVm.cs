using System.ComponentModel;

namespace AudioGo.ViewModels
{
    /// <summary>
    /// ViewModel dùng chung cho các chip lọc danh mục trên SearchPage và MainPage.
    /// Chứa Label hiển thị và Value để lọc API. Icon đã được loại bỏ.
    /// </summary>
    public class CategoryChipVm : INotifyPropertyChanged
    {
        public string Label { get; }
        public string Value { get; }

        private bool _isActive;
        public bool IsActive
        {
            get => _isActive;
            set
            {
                if (_isActive != value)
                {
                    _isActive = value;
                    PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(IsActive)));
                }
            }
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        public CategoryChipVm(string label, string value = "")
        {
            Label = label;
            Value = value;
        }

        /// <summary>
        /// Build chip list from API categories.
        /// Prepends "All" chip. Falls back to a minimal default if apiCategories is empty.
        /// </summary>
        public static List<CategoryChipVm> BuildFromApiCategories(
            IEnumerable<Shared.DTOs.CategoryDto> apiCategories,
            string lang = "vi")
        {
            var list = new List<CategoryChipVm>();

            // "All / Tất cả" chip always first
            list.Add(new CategoryChipVm(AudioGo.Helpers.AppStrings.GetForLanguage("cat_all", lang), ""));

            foreach (var cat in apiCategories)
            {
                // Translate category name from Vietnamese (DB key) to current language
                var displayLabel = AudioGo.Helpers.AppStrings.TranslateCategory(cat.Name);
                list.Add(new CategoryChipVm(displayLabel, cat.Name));
            }

            // If nothing from API, use hardcoded defaults (text only, no icons)
            if (list.Count == 1)
            {
                var defaults = GetDefaultChips(lang);
                foreach (var (label, value) in defaults)
                {
                    if (string.IsNullOrEmpty(value)) continue; // skip "all" duplicate
                    list.Add(new CategoryChipVm(label, value));
                }
            }

            return list;
        }

        /// <summary>Fallback chip list when API is unavailable. Text only, no icons.</summary>
        public static (string label, string value)[] GetDefaultChips(string lang = "vi")
        {
            return new[]
            {
                (AudioGo.Helpers.AppStrings.GetForLanguage("cat_all",           lang), ""),
                (AudioGo.Helpers.AppStrings.GetForLanguage("cat_food",          lang), "Ẩm thực"),
                (AudioGo.Helpers.AppStrings.GetForLanguage("cat_historical",    lang), "Di tích"),
                (AudioGo.Helpers.AppStrings.GetForLanguage("cat_coffee",        lang), "Cà phê"),
                (AudioGo.Helpers.AppStrings.GetForLanguage("cat_shopping",      lang), "Mua sắm"),
                (AudioGo.Helpers.AppStrings.GetForLanguage("cat_entertainment", lang), "Giải trí"),
                (AudioGo.Helpers.AppStrings.GetForLanguage("cat_culture",       lang), "Văn hóa"),
            };
        }
    }
}
