import { useState, useRef, useCallback } from "react";
import { MapPin, Plus, Minus, Search, Loader2, CheckCircle2 } from "lucide-react";

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

const InfoCardOfAddPOI = ({ form, handleChange, categories = [] }) => {
  const [addressQuery, setAddressQuery]   = useState("");
  const [geocoding, setGeocoding]         = useState(false);
  const [suggestions, setSuggestions]     = useState([]);
  const [geocodeOk, setGeocodeOk]         = useState(false);
  const debounceTimer                     = useRef(null);

  const adjustValue = (key, amount) => {
    handleChange(key, (parseFloat(form[key]) || 0) + amount);
  };

  // Debounced search — chờ 600ms sau khi người dùng ngừng gõ
  const handleAddressInput = useCallback((value) => {
    setAddressQuery(value);
    setGeocodeOk(false);
    clearTimeout(debounceTimer.current);
    if (!value.trim() || value.length < 4) {
      setSuggestions([]);
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      setGeocoding(true);
      try {
        const results = await geocode(value);
        setSuggestions(results || []);
      } catch {
        setSuggestions([]);
      } finally {
        setGeocoding(false);
      }
    }, 600);
  }, []);

  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    handleChange("lat", lat);
    handleChange("lng", lng);
    setAddressQuery(item.display_name);
    setSuggestions([]);
    setGeocodeOk(true);
  };

  const handleManualSearch = async () => {
    if (!addressQuery.trim()) return;
    setGeocoding(true);
    setSuggestions([]);
    setGeocodeOk(false);
    try {
      const results = await geocode(addressQuery);
      if (results && results.length > 0) {
        handleSelectSuggestion(results[0]);
      } else {
        setSuggestions([]);
        // nếu không tìm thấy, để trống suggestions để user thấy không có kết quả
        setSuggestions([{ display_name: "__empty__" }]);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
      
      <h3 className="text-[14px] font-black text-pink-500 uppercase tracking-widest border-b border-pink-50 pb-4">
        Cài đặt cơ bản
      </h3>

      <div className="space-y-5">

        {/* NAME */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
            Tên địa điểm
          </label>
          <input 
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Ví dụ: Lẩu bò khu phố..."
            className="w-full bg-transparent border-b-2 border-pink-100 py-2 outline-none focus:border-pink-500 transition-all font-bold text-gray-700"
          />
        </div>

        {/* CATEGORY - DROPDOWN */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-3">
            Danh mục (tối đa 2)
          </label>
          
          {/* Selected Categories as Badges */}
          <div className="space-y-2">
            {form.categories?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.categories.map((catId) => {
                  const cat = categories.find(c => c.categoryId === catId);
                  return cat ? (
                    <span key={catId} className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">
                      {cat.name}
                      <button
                        onClick={() => handleChange("categories", form.categories.filter(id => id !== catId))}
                        className="ml-1 hover:text-pink-900 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
            
            {/* Add Category Dropdown */}
            {form.categories?.length < 2 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleChange("categories", [...(form.categories || []), e.target.value]);
                  }
                }}
                className="w-full bg-white border-2 border-pink-100 rounded-lg py-2 px-3 outline-none focus:border-pink-500 transition-all font-medium text-gray-600 cursor-pointer"
              >
                <option value="" disabled>
                  Chọn danh mục
                </option>
                {categories.length > 0 ? (
                  categories.map((cat) => {
                    const isSelected = form.categories?.includes(cat.categoryId);
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
            
            {form.categories?.length >= 2 && (
              <p className="text-xs text-gray-400 italic">Đã chọn tối đa 2 danh mục</p>
            )}
          </div>
        </div>

        {/* LANGUAGE */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
            Ngôn ngữ
          </label>

          <select
            value={form.languageCode || ""}
            onChange={(e) => handleChange("languageCode", e.target.value)}
            className="w-full bg-transparent border-b-2 border-pink-100 py-2 outline-none focus:border-pink-500 transition-all font-medium text-gray-600"
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
        </div>

        {/* RADIUS */}
        <div className="pt-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
            Bán kính kích hoạt
          </label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-pink-500">
              50 <small className="text-sm">M</small>
            </span>
            <span className="text-xs text-gray-400 italic">(mặc định)</span>
          </div>
        </div>

        {/* ── ADDRESS SEARCH ─────────────────────────────── */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-pink-500" />
            <label className="text-[10px] font-bold text-gray-400 uppercase">
              Tìm địa chỉ (tự điền tọa độ)
            </label>
          </div>

          {/* Search input row */}
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => handleAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                placeholder="Nhập địa chỉ, tên đường, khu vực... (Enter)"
                className="flex-1 text-sm px-3 py-2 border-2 border-pink-100 rounded-xl outline-none focus:border-pink-400 transition-all text-gray-700 placeholder:text-gray-300"
              />
              <button
                onClick={handleManualSearch}
                disabled={geocoding || !addressQuery.trim()}
                className="px-3 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Tìm kiếm"
              >
                {geocoding ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Search size={15} />
                )}
              </button>
            </div>

            {/* Success indicator */}
            {geocodeOk && (
              <div className="flex items-center gap-1.5 mt-1.5 text-emerald-600">
                <CheckCircle2 size={13} />
                <span className="text-[11px] font-semibold">Đã điền tọa độ từ địa chỉ</span>
              </div>
            )}

            {/* Dropdown suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-xl border border-pink-100 overflow-hidden">
                {suggestions[0]?.display_name === "__empty__" ? (
                  <p className="px-4 py-3 text-xs text-gray-400 text-center">
                    Không tìm thấy địa chỉ nào phù hợp
                  </p>
                ) : (
                  suggestions.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-4 py-3 text-xs text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors border-b border-pink-50 last:border-0 line-clamp-2"
                    >
                      <span className="font-semibold">
                        {item.address?.amenity || item.address?.road || item.name || ""}
                        {(item.address?.amenity || item.address?.road || item.name) && " — "}
                      </span>
                      <span className="text-gray-400">{item.display_name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <p className="text-[10px] text-gray-400 italic">
            * Sử dụng OpenStreetMap — miễn phí, không cần tài khoản
          </p>
        </div>

        {/* LOCATION (manual lat/lng) */}
        <div className="pt-1 space-y-3">
          
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-pink-500" />
            <label className="text-[10px] font-bold text-gray-400 uppercase">
              Tọa độ vị trí
            </label>
          </div>

          {/* LAT */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-[30px]">Lat</span>

            <button
              onClick={() => adjustValue("lat", -0.0001)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <Minus size={14} />
            </button>

            <input
              type="number"
              step="0.0001"
              value={form.lat}
              onChange={(e) => handleChange("lat", parseFloat(e.target.value))}
              className="flex-1 px-2 py-1 border-b border-pink-100 outline-none focus:border-pink-500 text-sm"
            />

            <button
              onClick={() => adjustValue("lat", 0.0001)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* LNG */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-[30px]">Lng</span>

            <button
              onClick={() => adjustValue("lng", -0.0001)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <Minus size={14} />
            </button>

            <input
              type="number"
              step="0.0001"
              value={form.lng}
              onChange={(e) => handleChange("lng", parseFloat(e.target.value))}
              className="flex-1 px-2 py-1 border-b border-pink-100 outline-none focus:border-pink-500 text-sm"
            />

            <button
              onClick={() => adjustValue("lng", 0.0001)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* HINT */}
          <p className="text-[10px] text-gray-400 italic">
            * Bạn có thể tìm địa chỉ, nhập tay, dùng nút +/- hoặc chọn trực tiếp trên bản đồ
          </p>
        </div>

      </div>
    </div>
  );
};

export default InfoCardOfAddPOI;
