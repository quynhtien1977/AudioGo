import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Plus, GripVertical, Trash2, 
  MapPin, Upload, X, Loader2, Search
} from "lucide-react";
import toast from "react-hot-toast";

import TourRouteMap from "@/components/TourRouteMap";
import ConfirmModal from "@/components/ConfirmModal";
import { createTourApi, addPoiToTourApi, removePoiFromTourApi, reorderPoiInTourApi } from "@/api/tourApi";
import { getAllPOIs } from "@/api/poiApi";
import { uploadImage } from "@/api/mediaApi";

const CreateTourPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPOIs, setIsLoadingPOIs] = useState(true);
  const [availablePOIs, setAvailablePOIs] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const [tour, setTour] = useState({
    name: "",
    description: "",
    thumbnailUrl: null,
    pois: []
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmPoiId, setDeleteConfirmPoiId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Fetch available POIs
  useEffect(() => {
    const fetchAvailablePOIs = async () => {
      try {
        setIsLoadingPOIs(true);
        const allPOIs = await getAllPOIs();
        
        // Get IDs of POIs already in tour
        const tourPoiIds = new Set(tour.pois.map(p => p.poiId));
        
        // Filter POIs not in tour (and only active ones)
        const available = allPOIs.filter(poi => !tourPoiIds.has(poi.poiId || poi.id) && poi.isActive !== false);
        setAvailablePOIs(available);
      } catch (err) {
        console.error("Error fetching available POIs:", err);
        toast.error("Lỗi khi tải danh sách địa điểm");
      } finally {
        setIsLoadingPOIs(false);
      }
    };

    fetchAvailablePOIs();
  }, [tour.pois]);

  // === LOGIC QUAY LẠI ===
  const handleGoBack = () => {
        navigate("/admin/tours");
  };

  // === LOGIC TẠO TOUR ===
  const handleCreateTour = async () => {
    // Validate form
    if (!tour.name.trim()) {
      toast.error("Vui lòng nhập tên Tour");
      return;
    }

    if (!tour.description.trim()) {
      toast.error("Vui lòng nhập mô tả Tour");
      return;
    }

    if (tour.pois.length === 0) {
      toast.error("Vui lòng thêm ít nhất một địa điểm");
      return;
    }

    setIsSaving(true);
    try {
      // Create tour
      const newTour = await createTourApi({
        name: tour.name,
        description: tour.description,
        thumbnailUrl: tour.thumbnailUrl
      });

      // Add POIs to tour
      for (const poi of tour.pois) {
        await addPoiToTourApi(newTour.tourId, {
          PoiId: poi.poiId, 
          Title: poi.title,
          StepOrder: poi.stepOrder
        });
      }

      toast.success("Tạo Tour thành công!");
            navigate(`/admin/tours/${newTour.tourId}`);
    } catch (err) {
      console.error("Error creating tour:", err);
      toast.error("Lỗi khi tạo Tour");
    } finally {
      setIsSaving(false);
    }
  };

  // === LOGIC UPLOAD ẢNH ===
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    try {
      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onload = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);

      const imageUrl = await uploadImage(file, "tours");
      setTour({ ...tour, thumbnailUrl: imageUrl });
      toast.success("Tải ảnh lên thành công!");
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Lỗi khi tải ảnh lên");
      setThumbnailPreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setThumbnailPreview(null);
    setTour({ ...tour, thumbnailUrl: null });
    setIsUploadingImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // === LOGIC QUẢN LÝ POI ===
  const handleDeletePOI = async (poiId) => {
    try {
      setTour(prev => ({
        ...prev,
        pois: prev.pois.filter(p => p.poiId !== poiId)
      }));
      setDeleteConfirmPoiId(null);
      toast.success("Xóa POI khỏi Tour thành công!");
    } catch (err) {
      console.error("Error deleting POI:", err);
      toast.error("Lỗi khi xóa POI");
    }
  };

  const handleAddPOI = async (poi) => {
    try {
      const stepOrder = (tour.pois?.length || 0) + 1;
      const poiId = poi.poiId || poi.id;
      const poiTitle = poi.title || poi.name || "Untitled POI";
      
      setTour(prev => ({
        ...prev,
        pois: [...(prev.pois || []), {
          poiId: poiId,
          title: poiTitle,
          stepOrder: stepOrder
        }]
      }));
      setShowAddModal(false);
      setSearchTerm("");
      toast.success("Thêm POI vào Tour thành công!");
    } catch (err) {
      console.error("Error adding POI:", err);
      toast.error("Lỗi khi thêm POI");
    }
  };

  // === LOGIC DRAG-AND-DROP ===
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const newPois = [...tour.pois];
    const draggedPoi = newPois[draggedIndex];
    
    // Remove from old position
    newPois.splice(draggedIndex, 1);
    // Insert at new position
    newPois.splice(targetIndex, 0, draggedPoi);
    
    // Update stepOrder
    const updatedPois = newPois.map((poi, index) => ({
      ...poi,
      stepOrder: index + 1
    }));

    setTour(prev => ({
      ...prev,
      pois: updatedPois
    }));
    
    setDraggedIndex(null);
    toast.success("Sắp xếp POI thành công!");
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="p-8 bg-[#FDF8FA]/50 min-h-screen space-y-8 font-sans">
      {/* TOP NAVIGATION */}
      <div className="flex justify-between items-center">
        <button 
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-400 hover:text-[#D81B60] font-bold transition-all group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          Quay lại
        </button>
        <button 
          onClick={handleCreateTour}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-2xl font-bold hover:bg-pink-600 disabled:bg-gray-400 transition-all shadow-sm"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          {isSaving ? "Đang tạo..." : "Tạo Tour"}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Cột trái: Thông tin và danh sách địa điểm */}
        <div className="col-span-7 space-y-8">
          {/* FORM TẠO TOUR */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 space-y-6">
            <h2 className="text-xl font-black text-gray-800 border-b pb-4">Thông tin Tour</h2>
            
            {/* Ảnh Thumbnail */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Ảnh Thumbnail</label>
              {thumbnailPreview || tour.thumbnailUrl ? (
                <div className="relative">
                  <img 
                    src={thumbnailPreview || tour.thumbnailUrl} 
                    alt="preview" 
                    className="w-full h-64 object-cover rounded-xl border-2 border-pink-100" 
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-pink-300 hover:bg-pink-50/30 transition-all flex flex-col items-center justify-center gap-3"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="animate-spin text-pink-500" size={32} />
                      <span className="text-sm font-bold text-gray-600">Đang tải ảnh...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="text-gray-400" size={32} />
                      <span className="text-sm font-bold text-gray-600">Nhấp để chọn ảnh hoặc kéo thả</span>
                      <span className="text-xs text-gray-400">PNG, JPG, GIF tối đa 10MB</span>
                    </>
                  )}
                </div>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
                disabled={isUploadingImage}
              />
            </div>

            {/* Tên Tour */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tên Tour</label>
              <input 
                type="text" 
                placeholder="Nhập tên Tour của bạn..."
                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-pink-100 focus:border-transparent outline-none font-bold" 
                value={tour.name} 
                onChange={(e) => setTour({ ...tour, name: e.target.value })} 
              />
            </div>

            {/* Mô tả */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Mô tả Tour</label>
              <textarea 
                placeholder="Nhập mô tả chi tiết về Tour..."
                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-pink-100 focus:border-transparent outline-none h-24 resize-none font-bold" 
                value={tour.description} 
                onChange={(e) => setTour({ ...tour, description: e.target.value })} 
              />
            </div>
          </div>

          {/* DANH SÁCH ĐỊA ĐIỂM */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl text-gray-800">Thứ tự địa điểm thăm quan</h3>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-xl text-sm font-bold hover:bg-pink-600 hover:text-white transition-all"
              >
                <Plus size={16} /> Thêm địa điểm
              </button>
            </div>
            <div className="space-y-4">
              {tour.pois && tour.pois.length > 0 ? (
                tour.pois.map((poi, index) => (
                  <div 
                    key={poi.poiId}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={`group flex items-center gap-4 p-5 bg-gray-50 rounded-[1.5rem] border border-transparent hover:border-pink-200 hover:bg-pink-50/30 transition-all cursor-move ${
                      draggedIndex === index ? 'opacity-50 border-pink-400' : ''
                    }`}
                  >
                    <div className="cursor-grab active:cursor-grabbing text-gray-300 group-hover:text-pink-400"><GripVertical size={20} /></div>
                    <div className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center font-black text-pink-500 shadow-sm">{poi.stepOrder}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{poi.title}</h4>
                    </div>
                    <button 
                      onClick={() => setDeleteConfirmPoiId(poi.poiId)} 
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <MapPin className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-gray-400 font-bold">Chưa có địa điểm nào. Nhấp "Thêm địa điểm" để bắt đầu!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cột phải: Bản đồ */}
        <div className="col-span-5 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-4">
            <h3 className="font-bold text-gray-800 tracking-tight">Lộ Trình Tour</h3>
            {tour.pois && tour.pois.length > 0 ? (
              <TourRouteMap pois={tour.pois} />
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="text-center">
                  <MapPin className="mx-auto text-gray-300 mb-2" size={40} />
                  <p className="text-gray-400 font-bold text-sm">Thêm địa điểm để xem bản đồ</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      <ConfirmModal
        open={showAddModal}
        onConfirm={() => setShowAddModal(false)}
        onCancel={() => {
          setShowAddModal(false);
          setSearchTerm("");
        }}
        confirmText="Hoàn tất"
        cancelText="Hủy bỏ"
        message={
          <div className="w-full text-left">
             <h2 className="text-xl font-black text-gray-800 border-b pb-4 mb-6">Thêm địa điểm vào Tour</h2>
             <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Tìm tên địa điểm..." 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-pink-100 focus:border-transparent outline-none" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  autoFocus
                />
             </div>
             <div className="max-h-[300px] overflow-y-auto space-y-2">
                {isLoadingPOIs ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                    <p>Đang tải danh sách địa điểm...</p>
                  </div>
                ) : availablePOIs.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    <p>Không có địa điểm nào để thêm</p>
                  </div>
                ) : (
                  availablePOIs.filter(p => {
                    const poiName = p.name || p.title || p.Name || "N/A";
                    return poiName.toLowerCase().includes(searchTerm.toLowerCase());
                  }).map((poi) => {
                    const poiId = poi.poiId || poi.id;
                    const poiName = poi.name || poi.title || poi.Name || "N/A";
                    return (
                      <div key={poiId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-pink-50/50 transition-all">
                         <div>
                            <p className="font-bold text-sm text-gray-700">{poiName}</p>
                         </div>
                         <button 
                           onClick={() => handleAddPOI(poi)} 
                           className="px-4 py-2 bg-white text-pink-500 border border-pink-200 rounded-lg text-xs font-bold hover:bg-pink-500 hover:text-white transition-all"
                         > 
                           Thêm 
                         </button>
                      </div>
                    );
                  })
                )}
             </div>
          </div>
        }
      />

      <ConfirmModal
        open={deleteConfirmPoiId !== null}
        title="Xóa Địa Điểm"
        onConfirm={() => deleteConfirmPoiId && handleDeletePOI(deleteConfirmPoiId)}
        onCancel={() => setDeleteConfirmPoiId(null)}
        confirmText="Xóa"
        cancelText="Hủy"
        message="Bạn có chắc chắn muốn xóa địa điểm này khỏi Tour?"
      />
    </div>
  );
};

export default CreateTourPage;
