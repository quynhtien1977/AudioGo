import { Camera } from "lucide-react";
import { useRef } from "react";

const POIGallery = ({ images, isEditing, onChange }) => {
  // Tạo refs để kích hoạt input file ẩn
  const coverInputRef = useRef(null);
  const addPhotoInputRef = useRef(null);

  const mainImage = images?.[0] || "https://images.unsplash.com/photo-1544025162-d76694265947";
  const subImage1 = images?.[1] || "https://images.unsplash.com/photo-1528605248644-14dd04022da1";
  const subImage2 = images?.[2] || "https://images.unsplash.com/photo-1544025162-d76694265947";

  // Hàm xử lý khi chọn file
  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      
      // Tạo bản sao của mảng images hiện tại (hoặc mảng rỗng nếu chưa có)
      const currentImages = Array.isArray(images) ? [...images] : [];
      
      if (index === 0) {
        // Thay thế ảnh bìa (vị trí đầu tiên)
        currentImages[0] = imageUrl;
      } else if (index === -1) {
        // Thêm ảnh mới vào vị trí tiếp theo khả dụng (tối đa là index 2 cho 3 ảnh)
        if (currentImages.length < 3) {
          currentImages.push(imageUrl);
        } else {
          // Nếu đã đủ 3 ảnh, thay thế ảnh cuối cùng
          currentImages[2] = imageUrl;
        }
      }

      // Gửi mảng mới về cho cha
      onChange("images", currentImages);
    }
  };

  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-4 h-[450px]">
      {/* INPUT FILE ẨN */}
      <input 
        type="file" 
        ref={coverInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => handleFileChange(e, 0)} 
      />
      <input 
        type="file" 
        ref={addPhotoInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => handleFileChange(e, -1)} 
      />

      {/* ẢNH CHÍNH (BÊN TRÁI) */}
      <div className="col-span-2 row-span-2 relative group overflow-hidden rounded-3xl bg-gray-100">
        <img
          src={mainImage}
          alt="Main POI"
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        
        {isEditing && (
          <button 
            onClick={() => coverInputRef.current.click()}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-xl shadow-lg hover:bg-white transition-all active:scale-95"
          >
            <Camera className="w-4 h-4 text-pink-500" />
            <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">
              Thay ảnh bìa
            </span>
          </button>
        )}
      </div>

      {/* ẢNH PHỤ 1 (TRÊN CÙNG BÊN PHẢI) */}
      <div className="relative overflow-hidden rounded-3xl shadow-sm bg-gray-100">
        <img
          src={subImage1}
          alt="Sub 1"
          className="object-cover w-full h-full"
        />
      </div>

      {/* Ô ADD PHOTO (DƯỚI CÙNG BÊN PHẢI) */}
      <div className="relative group overflow-hidden rounded-3xl">
        {isEditing ? (
          <div 
            onClick={() => addPhotoInputRef.current.click()}
            className="w-full h-full border-2 border-dashed border-pink-200 bg-pink-50/50 flex flex-col items-center justify-center gap-2 hover:bg-pink-100 hover:border-pink-300 transition-all duration-300 cursor-pointer active:scale-95"
          >
            <div className="bg-white p-3 rounded-2xl shadow-sm text-pink-400">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mt-2">
              Thêm ảnh
            </span>
          </div>
        ) : (
          <img
            src={subImage2}
            alt="Sub 2"
            className="object-cover w-full h-full shadow-sm"
          />
        )}
      </div>
    </div>
  );
};

export default POIGallery;