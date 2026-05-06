import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Edit3, Trash2, MapPin, Calendar,
  Plus, GripVertical, Save, Star, Users, 
  TrendingUp, BarChart3, Share2, Search, Upload, X, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

import TourRouteMap from "@/components/TourRouteMap";
import ConfirmModal from "@/components/ConfirmModal";
import { getTourByIdApi, updateTourApi, addPoiToTourApi, removePoiFromTourApi, reorderPoiInTourApi } from "@/api/tourApi";
import { getAllPOIs, updatePOI } from "@/api/poiApi";
import { uploadImage } from "@/api/mediaApi";

const TourDetailPage = () => {
  const navigate = useNavigate();
  const { id: tourId } = useParams();
  const fileInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availablePOIs, setAvailablePOIs] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const [tour, setTour] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editFormData, setEditFormData] = useState(null);
  const [deleteConfirmPoiId, setDeleteConfirmPoiId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Fetch tour data from API
  useEffect(() => {
    const fetchTour = async () => {
      try {
        setIsLoading(true);
        console.log("📍 tourId from URL:", tourId);
        const data = await getTourByIdApi(tourId);
        console.log("✅ Tour loaded:", data);
        setTour(data);
        setEditFormData(data);
      } catch (err) {
        console.error("Error loading tour:", err);
        toast.error("Lỗi khi tải Tour");
        navigate("/tours");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTour();
  }, [tourId, navigate]);

  // Fetch available POIs (not yet added to tour)
  useEffect(() => {
    const fetchAvailablePOIs = async () => {
      try {
        const allPOIs = await getAllPOIs();
        
        if (tour && tour.pois) {
          // Get IDs of POIs already in tour
          const tourPoiIds = new Set(tour.pois.map(p => p.poiId));
          
          // Filter POIs not in tour
          const available = allPOIs.filter(poi => !tourPoiIds.has(poi.poiId || poi.id));
          setAvailablePOIs(available);
        } else {
          setAvailablePOIs(allPOIs);
        }
      } catch (err) {
        console.error("Error fetching available POIs:", err);
        toast.error("Lỗi khi tải danh sách địa điểm");
      }
    };

    if (tour) {
      fetchAvailablePOIs();
    }
  }, [tour]);

  // === LOGIC QUAY LẠI ===
  const handleGoBack = () => {
    navigate("/tours");
  };

  // === LOGIC LƯU THAY ĐỔI TỔNG THỂ ===
  const handleFinalSave = async () => {
    setIsSaving(true);
    try {
      await updateTourApi(tourId, {
        name: editFormData.name,
        description: editFormData.description,
        thumbnailUrl: editFormData.thumbnailUrl
      });
      setTour(editFormData);
      toast.success("Đã lưu thay đổi thành công!");
    } catch (err) {
      console.error("Error saving tour:", err);
      toast.error("Lỗi khi lưu Tour");
    } finally {
      setIsSaving(false);
    }
  };

  // === LOGIC CHỈNH SỬA THÔNG TIN CHI TIẾT (FORM) ===
  const handleOpenEdit = () => {
    setThumbnailPreview(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await updateTourApi(tourId, {
        name: editFormData.name,
        description: editFormData.description,
        thumbnailUrl: editFormData.thumbnailUrl
      });
      setTour(editFormData);
      setShowEditModal(false);
      setThumbnailPreview(null);
      toast.success("Cập nhật Tour thành công!");
    } catch (err) {
      console.error("Error updating tour:", err);
      toast.error("Lỗi khi cập nhật Tour");
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
      setEditFormData({ ...editFormData, thumbnailUrl: imageUrl });
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
    setEditFormData({ ...editFormData, thumbnailUrl: editFormData.thumbnailUrl });
    setIsUploadingImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // === LOGIC QUẢN LÝ POI ===
  const handleDeletePOI = async (poiId) => {
    try {
      // Remove POI from tour
      await removePoiFromTourApi(tourId, poiId);
      
      // Hide POI globally (set isActive = false)
      await updatePOI(poiId, { isActive: false });
      
      setTour(prev => ({
        ...prev,
        pois: prev.pois.filter(p => p.poiId !== poiId)
      }));
      toast.success("Xóa POI khỏi Tour và ẩn POI thành công!");
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
      
      // Send data with PascalCase keys to match C# backend expectations
      await addPoiToTourApi(tourId, {
        PoiId: poiId,
        Title: poiTitle,
        StepOrder: stepOrder
      });
      
      setTour(prev => ({
        ...prev,
        pois: [...(prev.pois || []), {
          poiId: poiId,
          title: poiTitle,
          stepOrder: stepOrder
        }]
      }));
      setShowAddModal(false);
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

  const handleDrop = async (targetIndex) => {
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

    // Save to database
    try {
      await reorderPoiInTourApi(tourId, updatedPois);
      toast.success("Cập nhật thứ tự POI thành công!");
    } catch (err) {
      console.error("Error reordering POI:", err);
      toast.error("Lỗi khi cập nhật thứ tự POI");
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="p-8 bg-[#FDF8FA]/50 min-h-screen space-y-8 font-sans">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-pink-500" size={24} />
            <span className="text-gray-600 font-bold">Đang tải Tour...</span>
          </div>
        </div>
      ) : !tour ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500 font-bold">Không tìm thấy Tour</p>
          </div>
        </div>
      ) : (
        <>
      {/* TOP NAVIGATION */}
      <div className="flex justify-between items-center">
        <button 
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-400 hover:text-[#D81B60] font-bold transition-all group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          Quay lại
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handleOpenEdit}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <Edit3 size={18} /> Chỉnh sửa thông tin Tour
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Cột trái: Thông tin và danh sách địa điểm */}
        <div className="col-span-7 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative h-64">
              <img src={tour.thumbnailUrl || "https://via.placeholder.com/400x400?text=No+Image"} className="w-full h-full object-cover" alt="tour" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-10">
                <div>
                  <h1 className="text-3xl font-black text-white mt-2">{tour.name}</h1>
                </div>
              </div>
            </div>
            <div className="p-10 space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Mô tả Tour</h3>
              <p className="text-gray-500 leading-relaxed italic">"{tour.description}"</p>
              <div className="flex gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="text-pink-500" size={18} />
                  <span className="text-sm font-bold text-gray-700">Ngày tạo: {new Date(tour.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="text-pink-500" size={18} />
                  <span className="text-sm font-bold text-gray-700">{tour.pois.length} Địa điểm</span>
                </div>
              </div>
              {tour.updatedAt && (
                <div className="flex items-center gap-2 pt-2">
                  <Calendar className="text-pink-400" size={18} />
                  <span className="text-sm font-bold text-gray-600">Cập nhật: {new Date(tour.updatedAt).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
            </div>
          </div>

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
              {tour.pois && tour.pois.map((poi, index) => (
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
                  <button onClick={() => setDeleteConfirmPoiId(poi.poiId)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cột phải: Bản đồ và Thống kê */}
        <div className="col-span-5 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-4">
            <h3 className="font-bold text-gray-800 tracking-tight">Lộ Trình Tour</h3>
            <TourRouteMap pois={tour.pois} />
          </div>
          
          {/* THỐNG KÊ CHƯA DÙNG TỚI NÊN TẠM ẨN */}
          {/* <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800 tracking-tight">Hiệu suất Hành trình</h3>
              <BarChart3 className="text-gray-300" size={20} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InsightCard icon={<Users size={18} className="text-blue-500" />} label="Khách tham gia" value="1,248" trend="+12%" />
              <InsightCard icon={<Star size={18} className="text-orange-500" />} label="Đánh giá TB" value="4.8/5" trend="~0%" />
              <InsightCard icon={<TrendingUp size={18} className="text-green-500" />} label="Lượt hoàn tất" value="85%" trend="+5%" />
              <InsightCard icon={<Share2 size={18} className="text-purple-500" />} label="Lượt chia sẻ" value="342" trend="+18%" />
            </div>
          </div> */}
        </div>
      </div>

      {/* MODALS */}
      <ConfirmModal
        open={showEditModal}
        title={null}
        onConfirm={handleSaveEdit}
        onCancel={() => {
          setShowEditModal(false);
          setThumbnailPreview(null);
          setIsUploadingImage(false);
        }}
        confirmText={isSaving ? "Đang cập nhật..." : "Cập nhật"}
        cancelText="Hủy bỏ"
        message={editFormData ? (
          <div className="w-full text-left">
            <h2 className="text-xl font-black text-gray-800 border-b pb-4 mb-6">Chỉnh sửa Hành trình</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tên hành trình</label>
                <input type="text" className="w-full p-4 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-pink-100 font-bold" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Mô tả</label>
                <textarea className="w-full p-4 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-pink-100 h-24 resize-none" value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Ảnh Thumbnail</label>
                {thumbnailPreview || editFormData.thumbnailUrl ? (
                  <div className="relative">
                    <img 
                      src={thumbnailPreview || editFormData.thumbnailUrl} 
                      alt="preview" 
                      className="w-full h-48 object-cover rounded-xl border-2 border-pink-100" 
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
            </div>
          </div>
        ) : null}
      />

      <ConfirmModal
        open={showAddModal}
        onConfirm={() => setShowAddModal(false)}
        onCancel={() => setShowAddModal(false)}
        confirmText="Hoàn tất"
        cancelText="Hủy bỏ"
        message={
          <div className="w-full text-left">
             <h2 className="text-xl font-black text-gray-800 border-b pb-4 mb-6">Thêm địa điểm vào Tour</h2>
             <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Tìm tên địa điểm..." className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-pink-100" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
             <div className="max-h-[300px] overflow-y-auto space-y-2">
                {availablePOIs.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    <p>Tất cả POI đã được thêm vào Tour</p>
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
                         <button onClick={() => handleAddPOI(poi)} className="px-4 py-2 bg-white text-pink-500 border border-pink-200 rounded-lg text-xs font-bold hover:bg-pink-500 hover:text-white transition-all"> Thêm </button>
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
        message="Bạn có chắc chắn muốn xóa địa điểm này khỏi Tour? Hành động này không thể hoàn tác."
      />
        </>
      )}
    </div>
  );
};

const InsightCard = ({ icon, label, value, trend }) => (
  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
    <div className="flex items-baseline justify-between font-sans">
      <span className="text-lg font-black text-gray-800">{value}</span>
      <span className={`text-[9px] font-bold ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{trend}</span>
    </div>
  </div>
);

export default TourDetailPage;