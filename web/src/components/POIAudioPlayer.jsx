import { CloudUpload, Trash2 } from "lucide-react";
import { useRef } from "react";

const POIAudioPlayer = ({ src, isEditing, onChange }) => {
  const fileInputRef = useRef(null);

  // Xử lý khi chọn file audio từ máy tính
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("audio/")) {
      const audioUrl = URL.createObjectURL(file);
      // Gửi URL tạm và tên file về component cha
      onChange("audio", audioUrl);
      // Bạn có thể lưu thêm file name vào state nếu cần
    }
  };

  const handleRemove = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa file âm thanh này không?")) {
      onChange("audio", "");
    }
  };

  return (
    <div className="relative bg-[#FFF5F7] p-8 rounded-[32px] border border-pink-50 shadow-sm">
      {/* Label tiêu đề góc phải */}
      <div className="absolute top-6 right-8">
        <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em]">
          File âm thanh
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Nút Upload / Icon Trạng thái */}
        <div 
          onClick={() => isEditing && fileInputRef.current.click()}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-inner transition-all 
            ${isEditing ? "cursor-pointer hover:scale-105 active:scale-95 bg-white" : "bg-pink-100"}`}
        >
          <div className="w-16 h-16 rounded-full bg-pink-200/30 flex items-center justify-center border-4 border-white">
            <CloudUpload className={`w-8 h-8 ${src ? "text-pink-500" : "text-pink-300"}`} />
          </div>
        </div>

        {/* Thông tin file & Progress Bar */}
        <div className="flex-1 space-y-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="audio/*" 
            onChange={handleFileChange} 
          />
          
          <h3 className="text-xl font-extrabold text-gray-700 tracking-tight">
            {src ? "Le_Petit_Bistro_Intro_v2.mp3" : "Chưa có file âm thanh"}
          </h3>

          {/* Thanh Progress */}
          <div className="relative w-full h-3 bg-pink-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-pink-400 rounded-full transition-all duration-500" 
              style={{ width: src ? "65%" : "0%" }}
            ></div>
          </div>

          {/* Metadata */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Format: MP3 • Duration: 1:24
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider italic">
              Emily Rose (FR Voice)
            </span>
          </div>
        </div>

        {/* Nút Xóa (Thùng rác) */}
        {isEditing && src && (
          <button 
            onClick={handleRemove}
            className="ml-4 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:bg-red-50 group transition-colors"
          >
            <Trash2 className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
};

export default POIAudioPlayer;