import { MapPin, Plus, Minus } from "lucide-react";

const InfoCardOfAddPOI = ({ form, handleChange, contentApi }) => {

  const adjustValue = (key, amount) => {
    handleChange(key, (parseFloat(form[key]) || 0) + amount);
  };

  const getLanguageName = (code) => {
    return contentApi.languages[code] || code;
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

        {/* CATEGORY */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
            Danh mục
          </label>
          <select 
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="w-full bg-transparent border-b-2 border-pink-100 py-2 outline-none focus:border-pink-500 transition-all font-medium text-gray-600"
          >
            <option value="Restaurant">Restaurant</option>
            <option value="Cafe">Cafe</option>
            <option value="Museum">Museum</option>
            <option value="Street Food">Street Food</option>
          </select>
        </div>

        {/* LANGUAGE */}
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
              { code: "en", label: "English" },
              { code: "fr", label: "French" },
              { code: "ja", label: "Japanese" },
              { code: "ko", label: "Korean" },
              { code: "th", label: "Thai" },
              { code: "vi", label: "Vietnamese" },
              { code: "zh-Hans", label: "Chinese (Simplified)" },
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
            Bán kính kích hoạt (M)
          </label>
          <div className="flex items-center gap-4">
            <input 
              type="range"
              value={form.radius}
              className="flex-1 accent-pink-500"
            />
            <span className="text-xl font-black text-pink-500">
              {form.radius}
              <small className="text-[10px] ml-1">M</small>
            </span>
          </div>
        </div>

        {/* LOCATION */}
        <div className="pt-4 space-y-3">
          
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
            * Bạn có thể nhập tay, dùng nút +/- hoặc chọn trực tiếp trên bản đồ
          </p>
        </div>

      </div>
    </div>
  );
};

export default InfoCardOfAddPOI;