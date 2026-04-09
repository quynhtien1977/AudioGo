const POIInfoCard = ({ poi, isEditing, form = {}, handleChange, role }) => {
  if (!poi) return null;

  // Helper để tạo style cho input đồng nhất
  const inputStyle = "w-full bg-transparent border-b border-pink-200 text-sm font-medium focus:border-pink-500 outline-none transition-colors pb-0.5";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
      <h4 className="text-[10px] font-bold text-pink-500 uppercase tracking-widest border-b border-pink-50 pb-2">
        THÔNG TIN CHI TIẾT
      </h4>

      {/* Row 1: Category & Language */}
      <div className="flex gap-6">
        <div className="flex-1 min-h-[45px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Danh mục</p>
          {isEditing ? (
            <div className="relative group">
              <select
                value={form.category || poi.category || ""}
                onChange={(e) => handleChange("category", e.target.value)}
                className={`appearance-none cursor-pointer ${inputStyle}`}
              >
                <option value="Fine Dining">Fine Dining</option>
                <option value="Casual Dining">Casual Dining</option>
                <option value="Cafe">Cafe</option>
                <option value="Street Food">Street Food</option>
              </select>
              <div className="pointer-events-none absolute right-0 bottom-1 flex items-center text-pink-400">
                <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          ) : (
            <span className="bg-pink-50 text-pink-600 px-2 py-0.5 rounded text-xs font-medium">
              {poi.category || "N/A"}
            </span>
          )}
        </div>

        <div className="flex-1 min-h-[45px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Ngôn ngữ</p>
          {isEditing ? (
            <div className="relative group">
      <select
        value={form.languageCode || poi?.languageCode || ""}
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
                value={form.lat || poi.lat || ""} 
                onChange={(e) => handleChange("lat", e.target.value)}
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
                value={form.lng || poi.lng || ""} 
                onChange={(e) => handleChange("lng", e.target.value)}
                className={inputStyle}
              />
            ) : (
              <span className="text-sm font-mono">{poi.lng}</span>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Radius */}
      <div className="min-h-[45px]">
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Phạm vi</p>
        <p className="text-sm font-bold text-gray-700 italic">{poi.ActivityRadius || 50} M</p>
      </div>

      {/* Status */}
      <div className="flex gap-4">

        <div className="flex-1">
          <p className="text-xs text-gray-400">Trạng thái</p>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              poi.status === "APPROVED"
                ? "bg-pink-100 text-pink-500"
                : poi.status === "PENDING"
                ? "bg-yellow-100 text-yellow-600"
                : poi.status === "REJECTED"
                ? "bg-gray-100 text-gray-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            {poi.status}
          </span>
        </div>
        
        <div className="flex-1">
          <p className="text-xs text-gray-400">Độ ưu tiên</p>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              poi.priority === "CRITICAL"
                ? "bg-red-100 text-red-600"
                : poi.priority === "HIGH"
                ? "bg-orange-100 text-orange-600"
                : poi.priority === "MEDIUM"
                ? "bg-blue-100 text-blue-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {poi.priority}
          </span>
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
