import { Camera, X, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { uploadImage } from "@/api/mediaApi";

// Giới hạn tối đa 4 ảnh: 1 main + 3 sub
const MAX_IMAGES = 4;

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1544025162-d76694265947",
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
];

const POIGallery = ({ images, isEditing, onChange }) => {
  const coverInputRef = useRef(null);
  const addPhotoInputRef = useRef(null);
  const subInputRefs = [useRef(null), useRef(null), useRef(null)];

  const [uploadingIndex, setUploadingIndex] = useState(null); // index đang upload, null = không upload

  const mainImage = images?.[0] || FALLBACK_IMAGES[0];
  const sub1 = images?.[1] || (isEditing ? null : FALLBACK_IMAGES[1]);
  const sub2 = images?.[2] || null;
  const sub3 = images?.[3] || null;

  // Upload ảnh lên Azure, trả về URL thật
  const handleFileChange = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input để có thể chọn lại cùng file
    e.target.value = "";

    try {
      setUploadingIndex(index);

      const url = await uploadImage(file);

      const currentImages = Array.isArray(images) ? [...images] : [];

      if (index === 0) {
        // Thay ảnh bìa
        currentImages[0] = url;
      } else {
        // Thêm ảnh mới vào cuối (nếu chưa đủ)
        if (currentImages.length < MAX_IMAGES) {
          currentImages.push(url);
        }
      }

      onChange("images", currentImages);
    } catch (err) {
      console.error("Upload ảnh thất bại:", err);
      alert("Upload ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setUploadingIndex(null);
    }
  };

  // Xóa ảnh phụ theo index (1, 2, 3)
  const handleRemoveSub = (index) => {
    const currentImages = Array.isArray(images) ? [...images] : [];
    currentImages.splice(index, 1);
    onChange("images", currentImages);
  };

  // Thêm ảnh phụ mới (khi click ADD slot)
  const handleAddPhoto = async (e) => {
    await handleFileChange(e, -1); // index -1 = thêm mới
  };

  // Render 1 slot ảnh phụ bên phải
  const renderSubSlot = (subImage, slotIndex, uiIndex) => {
    // slotIndex = 1/2/3 trong mảng images
    // uiIndex = 0/1/2 thứ tự hiển thị

    const isUploading = uploadingIndex === slotIndex;

    if (isUploading) {
      return (
        <div className="relative overflow-hidden rounded-3xl bg-pink-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
        </div>
      );
    }

    if (subImage) {
      return (
        <div className="relative overflow-hidden rounded-3xl shadow-sm bg-gray-100 group">
          <img
            src={subImage}
            alt={`Sub ${uiIndex + 1}`}
            className="object-cover w-full h-full"
          />
          {isEditing && (
            <button
              onClick={() => handleRemoveSub(slotIndex)}
              className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
              title="Xóa ảnh"
            >
              <X className="w-3 h-3 text-red-500" />
            </button>
          )}
          {isEditing && (
            <>
              <input
                type="file"
                ref={subInputRefs[uiIndex]}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, slotIndex)}
              />
              <button
                onClick={() => subInputRefs[uiIndex].current.click()}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 px-3 py-1 rounded-xl shadow text-[10px] font-bold text-pink-500 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition"
              >
                <Camera className="w-3 h-3" /> Đổi
              </button>
            </>
          )}
        </div>
      );
    }

    // Slot trống — hiện nút ADD nếu đang edit và chưa đủ ảnh
    if (isEditing && (images?.length || 0) < MAX_IMAGES) {
      return (
        <div className="relative group overflow-hidden rounded-3xl">
          <input
            type="file"
            ref={addPhotoInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleAddPhoto}
          />
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
        </div>
      );
    }

    // Slot trống, không edit: ô mờ giả
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gray-100 opacity-30" />
    );
  };

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-4 h-[480px]">
      {/* INPUT FILE ẨN — ảnh bìa */}
      <input
        type="file"
        ref={coverInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileChange(e, 0)}
      />

      {/* ẢNH CHÍNH (BÊN TRÁI — chiếm 2 cột × 3 hàng) */}
      <div className="col-span-2 row-span-3 relative group overflow-hidden rounded-3xl bg-gray-100">
        {uploadingIndex === 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-pink-50">
            <Loader2 className="w-10 h-10 text-pink-400 animate-spin" />
          </div>
        ) : (
          <img
            src={mainImage}
            alt="Main POI"
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
        )}

        <div className="absolute top-4 left-4 bg-pink-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">
          Ảnh Bìa / Logo
        </div>

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

      {/* ẢNH PHỤ 1 */}
      {renderSubSlot(sub1, 1, 0)}

      {/* ẢNH PHỤ 2 */}
      {renderSubSlot(sub2, 2, 1)}

      {/* ẢNH PHỤ 3 */}
      {renderSubSlot(sub3, 3, 2)}
    </div>
  );
};

export default POIGallery;