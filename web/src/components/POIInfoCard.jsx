import { useState, useEffect } from "react"
import { getCategoriesApi } from "@/api/categoryApi"
import { getPriorityColor, getPriorityInfo } from "@/components/PriorityBadge"

const POIInfoCard = ({ poi, isEditing, form = {}, handleChange, role, getCategoryColor }) => {
  if (!poi) return null;

  const [categories, setCategories] = useState([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategoriesApi()
        setCategories(data || [])
      } catch (err) {
        console.error("Error fetching categories:", err)
      }
    }
    fetchCategories()
  }, [])

  // Helper để tạo style cho input đồng nhất
  const inputStyle = "w-full bg-transparent border-b border-pink-200 text-sm font-medium focus:border-pink-500 outline-none transition-colors pb-0.5";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
      <h4 className="text-[10px] font-bold text-pink-500 uppercase tracking-widest border-b border-pink-50 pb-2">
        THÔNG TIN CHI TIẾT
      </h4>

      {/* Row 1: Category & Language */}
      <div className="flex gap-6 flex-col">
        <div className="flex-1 min-h-[45px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Danh mục</p>
          {isEditing ? (
            <div className="space-y-2 bg-pink-50/30 p-4 rounded-lg border-2 border-dashed border-pink-100">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <label key={cat.categoryId} className="flex items-center gap-2 cursor-pointer hover:bg-white/50 p-2 rounded transition">
                    <input
                      type="checkbox"
                      checked={poi.categories?.includes(cat.categoryId) || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleChange("categories", [...(poi.categories || []), cat.categoryId]);
                        } else {
                          handleChange("categories", (poi.categories || []).filter(id => id !== cat.categoryId));
                        }
                      }}
                      className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 font-medium">{cat.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">Không có danh mục nào</p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {poi.categories && poi.categories.length > 0 ? (
                poi.categories.map((catId) => {
                  const cat = categories.find(c => c.categoryId === catId);
                  return cat ? (
                    <span key={catId} className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor ? getCategoryColor(cat.name) : "bg-pink-50 text-pink-600"}`}>
                      {cat.name}
                    </span>
                  ) : null;
                })
              ) : (
                <span className="text-xs text-gray-400 italic">Chưa chọn danh mục</span>
              )}
            </div>
          )}
          {poi.categories?.length > 0 && isEditing && (
            <p className="text-xs text-pink-500 mt-2 font-semibold">
              ✓ Đã chọn {poi.categories.length} danh mục
            </p>
          )}
        </div>

        <div className="flex-1 min-h-[45px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Ngôn ngữ</p>
          {isEditing ? (
            <div className="relative group">
      <select
        value={poi.languageCode || ""}
        onChange={(e) => handleChange("languageCode", e.target.value)}
        className={`appearance-none cursor-pointer ${inputStyle}`}
      >
        <option value="" disabled>
          Chọn ngôn ngữ
        </option>

        {[
          { code: "en", label: "Tiếng Anh" },
          { code: "fr", label: "Tiếng Pháp" },
          { code: "ja", label: "Tiếng Nhật" },
          { code: "ko", label: "Tiếng Hàn" },
          { code: "th", label: "Tiếng Thái" },
          { code: "vi", label: "Tiếng Việt" },
          { code: "zh-Hans", label: "Tiếng Trung (Giản thể)" },
        ].map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>

      <div className="pointer-events-none absolute right-0 bottom-1 flex items-center text-pink-400">
        <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
            
          ) : (
            <span className="bg-pink-50 text-pink-600 px-2 py-0.5 rounded text-xs font-medium">
              {languageLabels[poi.languageCode] || "N/A"}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Location (Lat/Lng) */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase">Vị trí</p>
        <div className="flex gap-4 min-h-[35px] items-end">
          <div className="flex-1 flex items-center gap-2 border-b border-gray-100 pb-1">
            <span className="text-[9px] font-bold text-gray-300">LAT</span>
            {isEditing ? (
              <input 
                type="number"
                step="0.000001"
                value={poi.lat || ""} 
                onChange={(e) => handleChange("lat", parseFloat(e.target.value) || 0)}
                className={inputStyle}
              />
            ) : (
              <span className="text-sm font-mono">{poi.lat}</span>
            )}
          </div>
          <div className="flex-1 flex items-center gap-2 border-b border-gray-100 pb-1">
            <span className="text-[9px] font-bold text-gray-300">LNG</span>
            {isEditing ? (
              <input 
                type="number" 
                step="0.000001"
                value={poi.lng || ""} 
                onChange={(e) => handleChange("lng", parseFloat(e.target.value) || 0)}
                className={inputStyle}
              />
            ) : (
              <span className="text-sm font-mono">{poi.lng}</span>
            )}
          </div>
        </div>
      </div>


      <div className="flex gap-4 items-center">
        {/* Row 3: Radius */}
        <div className="flex-1 min-h-[45px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Phạm vi</p>
          <p className="text-sm font-bold text-gray-700 italic">{poi.ActivityRadius || 50} M</p>
        </div>
        {/* Priority */}
        <div className="flex-1 min-h-[45px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Độ ưu tiên</p>

          {isEditing ? (
            <div className="relative">
              <select
                value={poi.priority ?? 1}
                onChange={(e) => handleChange("priority", Number(e.target.value))}
                className={`appearance-none cursor-pointer ${inputStyle}`}
              >
                <option value={1}>LOW</option>
                <option value={2}>MEDIUM</option>
                <option value={3}>HIGH</option>
                <option value={4}>CRITICAL</option>
              </select>

              <div className="pointer-events-none absolute right-0 bottom-1 flex items-center text-pink-400">
                <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          ) : (
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(poi.priority)}`}
            >
              {getPriorityInfo(poi.priority).label}
            </span>
          )}
        </div>
      </div>

    </div>
  );
};

export default POIInfoCard;

const languageLabels = {
  en: "Tiếng Anh",
  fr: "Tiếng Pháp",
  ja: "Tiếng Nhật",
  ko: "Tiếng Hàn",
  th: "Tiếng Thái",
  vi: "Tiếng Việt",
  "zh-Hans": "Tiếng Trung (Giản thể)",
};
