import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, MapPin, Radio, LayoutGrid, Info, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import POIMap from "@/components/POIMapPreview";
import POIGallery from "@/components/POIGallery";
import POIAudioPlayer from "@/components/POIAudioPlayer";
import InfoCardOfAddPOI from "@/components/InfoCardOfAddPOI";
import ConfirmModal from "@/components/ConfirmModal";

import { uploadImage, uploadAudio } from "@/api/mediaApi";
import { createPoiRequest } from "@/api/poiRequestApi";
import { getCategoriesApi } from "@/api/categoryApi";

const AddPOIPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    categories: [],
    lat: 10.7574,
    lng: 106.7020,
    radius: 50,
    languageCode: "en",
    images: [],
    audio: "",
    script: "",
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  // Bug #2: lưu File objects chưa upload
  const pendingImageFiles = useRef([]); // File[] tương ứng với images[]
  const pendingAudioFile  = useRef(null); // File | null

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategoriesApi();
        setCategories(data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Bug #2: nhận danh sách File objects từ POIGallery
  const handlePendingImageFiles = (files) => {
    pendingImageFiles.current = files || [];
  };

  // Bug #2: nhận File object từ POIAudioPlayer
  const handlePendingAudioFile = (file) => {
    pendingAudioFile.current = file || null;
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên POI");
      return;
    }
    if (form.categories.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 danh mục");
      return;
    }
    // Ràng buộc: phải có ít nhất 1 ảnh logo VÀ 1 ảnh gallery
    if (form.images.length === 0) {
      toast.error("Vui lòng thêm ảnh logo (ảnh đầu tiên)");
      return;
    }
    if (form.images.length < 2) {
      toast.error("Vui lòng thêm ít nhất 1 ảnh gallery (ngoài ảnh logo)");
      return;
    }
    if (!form.script.trim()) {
      toast.error("Vui lòng nhập nội dung script");
      return;
    }
    setShowConfirmModal(true);

  };

  const handleConfirmCreate = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);

      // ===== Bug #2: Upload pending files lên Azure trước khi submit =====
      let finalImages = [...(form.images || [])];
      let finalAudio  = form.audio || "";

      // Upload từng ảnh pending (blob URL → Azure URL)
      for (let i = 0; i < finalImages.length; i++) {
        if (finalImages[i].startsWith("blob:") && pendingImageFiles.current[i]) {
          try {
            const url = await uploadImage(pendingImageFiles.current[i], "pois");
            finalImages[i] = url;
          } catch {
            toast.error(`Lỗi upload ảnh ${i + 1}. Vui lòng thử lại.`);
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Upload audio pending nếu có
      if (finalAudio.startsWith("blob:") && pendingAudioFile.current) {
        try {
          finalAudio = await uploadAudio(pendingAudioFile.current);
        } catch {
          toast.error("Lỗi upload audio. Vui lòng thử lại.");
          setIsSubmitting(false);
          return;
        }
      }

      // Build payload và gửi request
      const selectedCategoryIds = form.categories;
      const payload = {
        ActionType: "CREATE",
        PoiId: null,
        Draft: {
          Title: form.name,
          Description: form.script || "",
          Latitude: form.lat,
          Longitude: form.lng,
          ActivationRadius: form.radius || 50,
          Priority: 1,
          LogoUrl: finalImages[0] || "",
          GalleryImageUrls: finalImages,
          AudioUrl: finalAudio,
          CategoryIds: selectedCategoryIds,
          LanguageCode: form.languageCode || "en",
        }
      };

      await createPoiRequest(payload);
      toast.success("Tạo yêu cầu POI mới thành công! Admin sẽ xem xét.");
      setShowConfirmModal(false);
      setTimeout(() => navigate("/pois"), 1500);
    } catch (err) {
      console.error(err);
      toast.error("Tạo yêu cầu thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 bg-pink-50/20 min-h-screen space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <nav className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em] mb-2"></nav>
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
            disabled={isSubmitting}
            className="px-8 py-3 bg-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest disabled:opacity-60"
          >
            <Save size={16} /> {isSubmitting ? "Đang gửi..." : "Lưu thông tin"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* LEFT */}
        <div className="col-span-8 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <LayoutGrid size={20} className="text-pink-500" />
              <h2 className="text-lg font-bold text-gray-700">Hình ảnh không gian</h2>
            </div>
            {/* Bug #2: uploadOnSelect=false, chỉ upload khi submit */}
            <POIGallery
              images={form.images}
              isEditing={true}
              onChange={handleChange}
              uploadOnSelect={false}
              onPendingFiles={handlePendingImageFiles}
            />
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Radio size={20} className="text-pink-500" />
              <h2 className="text-lg font-bold text-gray-700">Tệp âm thanh thuyết minh</h2>
            </div>
            {/* Bug #2: uploadOnSelect=false */}
            <POIAudioPlayer
              src={form.audio}
              isEditing={true}
              onChange={handleChange}
              uploadOnSelect={false}
              onPendingFile={handlePendingAudioFile}
            />
          </section>

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

        {/* RIGHT */}
        <div className="col-span-4 space-y-8">
          <InfoCardOfAddPOI form={form} handleChange={handleChange} categories={categories} />

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

      {/* LOADING OVERLAY khi đang upload files */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
            <p className="text-gray-700 font-bold text-base">Đang tải lên server...</p>
            <p className="text-gray-400 text-xs text-center max-w-[220px]">
              Vui lòng không đóng trang. Đang xử lý ảnh và audio.
            </p>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <ConfirmModal
          open={showConfirmModal}
          title="Xác nhận tạo POI mới?"
          message="POI mới sẽ được gửi đến Admin để phê duyệt. Bạn có chắc chắn muốn tiếp tục?"
          confirmText="Tạo POI"
          cancelText="Hủy bỏ"
          isLoading={isSubmitting}
          onConfirm={handleConfirmCreate}
          onCancel={() => !isSubmitting && setShowConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default AddPOIPage;