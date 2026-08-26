import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Loader2, CheckCircle2 } from "lucide-react"
import { getCategoriesApi } from "@/api/categoryApi"
import PriorityBadge, { getPriorityColor, getPriorityInfo } from "@/components/PriorityBadge"

// Proxy qua backend — tránh ERR_CERT_INVALID khi gọi external HTTPS từ browser
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5086/api";

const geocode = async (query) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const url   = `${API_BASE}/cms/geocoding/search?q=${encodeURIComponent(query)}&limit=5`;
  const res   = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Geocoding proxy error");
  return res.json();
};

const POIInfoCard = ({ poi, isEditing, form = {}, handleChange, role, getCategoryColor }) => {
  const [categories, setCategories] = useState([])

  // Address geocoding state
  const [addressQuery, setAddressQuery] = useState("")
  const [geocoding, setGeocoding]       = useState(false)
  const [suggestions, setSuggestions]   = useState([])
  const [geocodeOk, setGeocodeOk]       = useState(false)
  const debounceTimer                   = useRef(null)

  const handleAddressInput = useCallback((value) => {
    setAddressQuery(value)
    setGeocodeOk(false)
    clearTimeout(debounceTimer.current)
    if (!value.trim() || value.length < 4) { setSuggestions([]); return }
    debounceTimer.current = setTimeout(async () => {
      setGeocoding(true)
      try { setSuggestions(await geocode(value)) }
      catch { setSuggestions([]) }
      finally { setGeocoding(false) }
    }, 600)
  }, [])

  const handleSelectSuggestion = (item) => {
    handleChange("lat", parseFloat(item.lat))
    handleChange("lng", parseFloat(item.lon))
    setAddressQuery(item.display_name)
    setSuggestions([])
    setGeocodeOk(true)
  }

  const handleManualSearch = async () => {
    if (!addressQuery.trim()) return
    setGeocoding(true); setSuggestions([]); setGeocodeOk(false)
    try {
      const results = await geocode(addressQuery)
      if (results?.length > 0) handleSelectSuggestion(results[0])
      else setSuggestions([{ display_name: "__empty__" }])
    } catch { setSuggestions([]) }
    finally { setGeocoding(false) }
  }

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

  // Early return AFTER hooks
  if (!poi) return null;

  // Helper để tạo style cho input đồng nhất
  const inputStyle = "w-full bg-transparent border-b border-pink-200 text-sm font-medium focus:border-pink-500 outline-none transition-colors pb-0.5";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
      <h4 className="text-[10px] font-bold text-pink-500 uppercase tracking-widest border-b border-pink-50 pb-2">
        THÔNG TIN CHI TIẾT
      </h4>

      {/* Row 1: Category & Language */}
      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="min-h-[45px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Danh mục (tối đa 2)</p>
            <div className="space-y-2">
              {/* Selected Categories as Badges */}
              {poi.categories?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {poi.categories.map((catId) => {
                    const cat = categories.find(c => c.categoryId === catId);
                    return cat ? (
                      <span key={catId} className="inline-flex items-center gap-1.5 bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                        {cat.name}
                        <button
                          type="button"
                          onClick={() => handleChange("categories", poi.categories.filter(id => id !== catId))}
                          className="hover:text-pink-900 font-bold"
                        >
                          ✕
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              
              {/* Add Category Dropdown */}
              {poi.categories?.length < 2 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleChange("categories", [...(poi.categories || []), e.target.value]);
                    }
                  }}
                  className="w-full bg-white border border-pink-100 rounded-lg py-1.5 px-2.5 outline-none focus:border-pink-500 transition-all font-medium text-xs text-gray-600 cursor-pointer"
                >
                  <option value="" disabled>
                    Chọn danh mục
                  </option>
                  {categories.length > 0 ? (
                    categories.map((cat) => {
                      const isSelected = poi.categories?.includes(cat.categoryId);
                      return !isSelected ? (
                        <option key={cat.categoryId} value={cat.categoryId}>
                          {cat.name}
                        </option>
                      ) : null;
                    })
                  ) : (
                    <option disabled>Không có danh mục nào</option>
                  )}
                </select>
              )}
              
              {poi.categories?.length >= 2 && (
                <p className="text-[10px] text-gray-400 italic">Đã chọn tối đa 2 danh mục</p>
              )}
            </div>
          </div>

          <div className="min-h-[45px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Ngôn ngữ <span className="text-[9px] lowercase font-normal italic text-gray-400">(cố định)</span></p>
            <div className="relative group pt-1">
              <select
                value={poi.languageCode || ""}
                onChange={(e) => handleChange("languageCode", e.target.value)}
                disabled={true}
                className={`appearance-none ${inputStyle} opacity-60 cursor-not-allowed`}
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
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Danh mục</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {poi.categories && poi.categories.length > 0 ? (
                poi.categories.map((catId, idx) => {
                  const cat = categories.find(c => c.categoryId === catId || c.name === catId);
                  const catName = cat ? cat.name : (categories.length > 0 ? catId : (idx === 0 && poi.category ? poi.category : "Đang tải..."));
                  return (
                    <span key={idx} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryColor ? getCategoryColor(catName) : "bg-pink-50 text-pink-600"}`}>
                      {catName}
                    </span>
                  );
                })
              ) : poi.category ? (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryColor ? getCategoryColor(poi.category) : "bg-pink-50 text-pink-600"}`}>
                  {poi.category}
                </span>
              ) : (
                <span className="text-xs text-gray-400 italic">Chưa chọn danh mục</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Ngôn ngữ</p>
            <div className="pt-1">
              <span className="bg-pink-50 text-pink-600 px-2.5 py-1 rounded-full text-xs font-semibold inline-block">
                {languageLabels[poi.languageCode] || "N/A"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Row 2: Location (Lat/Lng) + Address Search */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase">Vị trí</p>

        {/* Address geocoding — chỉ hiện khi đang sửa */}
        {isEditing && (
          <div className="relative space-y-1">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => handleAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                placeholder="Tìm địa chỉ để điền tọa độ..."
                className="flex-1 text-xs px-2.5 py-1.5 border border-pink-100 rounded-lg outline-none focus:border-pink-400 transition-all text-gray-700 placeholder:text-gray-300"
              />
              <button
                onClick={handleManualSearch}
                disabled={geocoding || !addressQuery.trim()}
                className="px-2.5 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {geocoding ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              </button>
            </div>
            {geocodeOk && (
              <div className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 size={11} />
                <span className="text-[10px] font-semibold">Đã cập nhật tọa độ</span>
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="absolute z-50 mt-0.5 w-full bg-white rounded-lg shadow-xl border border-pink-100 overflow-hidden">
                {suggestions[0]?.display_name === "__empty__" ? (
                  <p className="px-3 py-2 text-[11px] text-gray-400 text-center">Không tìm thấy địa chỉ</p>
                ) : (
                  suggestions.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-3 py-2 text-[11px] text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors border-b border-pink-50 last:border-0 line-clamp-2"
                    >
                      {item.display_name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

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
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Độ ưu tiên <span className="text-[9px] lowercase font-normal italic text-gray-400">(theo gói cước)</span></p>

          {isEditing ? (
            <div className="relative">
              <select
                value={poi.priority ?? 1}
                onChange={(e) => handleChange("priority", Number(e.target.value))}
                disabled={true}
                className={`appearance-none ${inputStyle} opacity-60 cursor-not-allowed`}
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
            <div className="pt-1">
              <PriorityBadge value={poi.priority} />
            </div>
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
