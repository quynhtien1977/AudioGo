import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, MapPin, Radio, LayoutGrid, Info } from "lucide-react";
import { createPortal } from "react-dom";

import POIMap from "@/components/POIMapPreview";
import POIGallery from "@/components/POIGallery";
import POIAudioPlayer from "@/components/POIAudioPlayer";
import InfoCardOfAddPOI from "@/components/InfoCardOfAddPOI";

const AddPOIPage = () => {
  const navigate = useNavigate();
  
  // State khởi tạo cho POI mới
  const [form, setForm] = useState({
    name: "",
    category: "Restaurant",
    lat: 10.7574, // Mặc định Vĩnh Khánh Q4
    lng: 106.7020,
    radius: 50,
    images: [],
    audio: "",
    script: ""
  });

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // Logic gọi API POST ở đây
    console.log("Dữ liệu POI mới:", form);
    alert("Đã thêm POI mới thành công!");
    navigate("/pois");
  };

  return (
    <div className="p-8 bg-pink-50/20 min-h-screen space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <nav className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em] mb-2">
          </nav>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">TẠO POI MỚI</h1>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-2xl font-bold text-gray-400 hover:bg-white transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest"
          >
            <X size={16} /> Hủy bỏ
          </button>
          <button 
            onClick={handleSave}
            className="px-8 py-3 bg-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest"
          >
            <Save size={16} /> Lưu thông tin
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Media & Content */}
        <div className="col-span-8 space-y-8">
          
          {/* Gallery Upload */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <LayoutGrid size={20} className="text-pink-500" />
              <h2 className="text-lg font-bold text-gray-700">Hình ảnh không gian</h2>
            </div>
            <POIGallery 
              images={form.images} 
              isEditing={true} 
              onChange={handleChange} 
            />
          </section>

          {/* Audio Manager */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Radio size={20} className="text-pink-500" />
              <h2 className="text-lg font-bold text-gray-700">Tệp âm thanh thuyết minh</h2>
            </div>
            <POIAudioPlayer 
              src={form.audio} 
              isEditing={true} 
              onChange={handleChange} 
            />
          </section>

          {/* Script Content */}
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
              <h2 className="text-lg font-bold text-gray-700">Nội dung Script</h2>
              <button className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Auto-Generate</button>
            </div>
            <textarea
              value={form.script}
              onChange={(e) => handleChange("script", e.target.value)}
              placeholder="Nhập kịch bản thuyết minh cho audio guide..."
              className="w-full min-h-[150px] bg-pink-50/30 rounded-2xl p-6 outline-none text-gray-600 italic leading-relaxed border-2 border-dashed border-transparent focus:border-pink-200 transition-all"
            />
          </section>
        </div>

        {/* RIGHT COLUMN: Settings & Location */}
        <div className="col-span-4 space-y-8">
          
          {/* Basic Info Card */}
          <InfoCardOfAddPOI form={form} handleChange={handleChange} />


          {/* Location Card */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Vị trí thực tế</h3>
              <div className="flex gap-2 text-[10px] font-mono text-gray-400">
                <span>{form.lat.toFixed(4)}</span>
                <span>/</span>
                <span>{form.lng.toFixed(4)}</span>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden h-[250px] border border-gray-50 relative group">
              <POIMap
                lat={form.lat} 
                lng={form.lng} 
                isEditing={true} 
                onLocationSelect={(lat, lng) => {
                  handleChange("lat", lat);
                  handleChange("lng", lng);
                }} 
              />
              <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-md p-2 rounded-lg pointer-events-none">
                 <MapPin size={14} className="text-pink-500" />
              </div>
            </div>
            
            <p className="text-[9px] text-gray-400 italic text-center">
              * Nhấp trực tiếp lên bản đồ để lấy tọa độ chính xác
            </p>
          </div>

          {/* Hint Card */}
          <div className="bg-pink-500 p-6 rounded-[32px] text-white space-y-2 shadow-lg shadow-pink-100">
            <div className="flex items-center gap-2">
              <Info size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Lưu ý</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              Các POI mới tạo sẽ ở trạng thái <strong>PENDING</strong> và cần được Admin phê duyệt trước khi hiển thị trên ứng dụng khách hàng.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AddPOIPage;