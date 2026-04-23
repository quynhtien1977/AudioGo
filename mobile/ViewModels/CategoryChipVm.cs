using System.ComponentModel;

namespace AudioGo.ViewModels
{
    /// <summary>
    /// ViewModel dùng chung cho các chip lọc danh mục trên SearchPage và MainPage.
    /// Chứa Label hiển thị, Icon (Material Icon codepoint) và Value để lọc API.
    /// </summary>
    public class CategoryChipVm : INotifyPropertyChanged
    {
        public string Label { get; }
        public string Icon  { get; }
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

        public CategoryChipVm(string label, string icon, string value = "")
        {
            Label = label;
            Icon  = icon;
            Value = value;
        }

        // ── Icon mapping: category name (lowercase) → Material Icon codepoint ──
        private static readonly Dictionary<string, string> _iconMap = new(StringComparer.OrdinalIgnoreCase)
        {
            { "ẩm thực",    "\ue56c" },  // restaurant
            { "food",       "\ue56c" },
            { "di tích",    "\ue84f" },  // account_balance
            { "historical", "\ue84f" },
            { "cà phê",     "\uef6c" },  // local_cafe
            { "coffee",     "\uef6c" },
            { "mua sắm",    "\ue8cb" },  // shopping_bag
            { "shopping",   "\ue8cb" },
            { "giải trí",   "\ue552" },  // local_activity
            { "entertainment", "\ue552" },
            { "văn hóa",    "\ue54e" },  // museum
            { "culture",    "\ue54e" },
            { "công viên",  "\ue566" },  // park
            { "park",       "\ue566" },
            { "khách sạn",  "\ue53a" },  // hotel
            { "hotel",      "\ue53a" },
            { "y tế",       "\ue548" },  // local_hospital
            { "health",     "\ue548" },
            { "giáo dục",   "\ue80c" },  // school
            { "education",  "\ue80c" },
            { "tôn giáo",   "\uea53" },  // place_of_worship
            { "religious",  "\uea53" },
        };

        public static string GetIconForCategory(string categoryName)
        {
            if (_iconMap.TryGetValue(categoryName, out var icon))
                return icon;
            return "\ue55f"; // location_on — fallback
        }

        /// <summary>
        /// Build chip list from API categories.
        /// Prepends "All" chip + maps each category name to a Material Icon.
        /// Falls back to GetDefaultChips if apiCategories is empty.
        /// </summary>
        public static List<CategoryChipVm> BuildFromApiCategories(
            IEnumerable<Shared.DTOs.CategoryDto> apiCategories,
            string lang = "vi")
        {
            var list = new List<CategoryChipVm>();

            // "All / Tất cả" chip always first
            list.Add(new CategoryChipVm(AudioGo.Helpers.AppStrings.GetForLanguage("cat_all", lang), "\ue88a", ""));

            foreach (var cat in apiCategories)
            {
                var icon = GetIconForCategory(cat.Name);
                // Translate category name from Vietnamese (DB key) to current language
                var displayLabel = AudioGo.Helpers.AppStrings.TranslateCategory(cat.Name);
                list.Add(new CategoryChipVm(displayLabel, icon, cat.Name));
            }

            // If nothing from API, use hardcoded defaults (minus "all" which we already added)
            if (list.Count == 1)
            {
                foreach (var (label, chipIcon, value) in GetDefaultChips())
                {
                    if (string.IsNullOrEmpty(value)) continue; // skip "all" duplicate
                    list.Add(new CategoryChipVm(label, chipIcon, value));
                }
            }

            return list;
        }

        public static (string label, string icon, string value)[] GetDefaultChips()
        {
            // Uses AppStrings to return translated labels for the current app language
            return new[]
            {
                (AudioGo.Helpers.AppStrings.Get("cat_all"),           "\ue88a", ""),
                (AudioGo.Helpers.AppStrings.Get("cat_food"),          "\ue56c", "Ẩm thực"),
                (AudioGo.Helpers.AppStrings.Get("cat_historical"),    "\ue84f", "Di tích"),
                (AudioGo.Helpers.AppStrings.Get("cat_coffee"),        "\uef6c", "Cà phê"),
                (AudioGo.Helpers.AppStrings.Get("cat_shopping"),      "\ue8cb", "Mua sắm"),
                (AudioGo.Helpers.AppStrings.Get("cat_entertainment"), "\ue552", "Giải trí"),
                (AudioGo.Helpers.AppStrings.Get("cat_culture"),       "\ue54e", "Văn hóa"),
            };
        }
    }
}
