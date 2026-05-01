import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, MapPin, Calendar, ShieldCheck, Eye, ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";

import ConfirmModal from "@/components/ConfirmModal";
import CreateTourModal from "@/components/CreateTourModal";
import Card from "@/components/Card";
import { getAllToursApi, createTourApi, deleteTourApi, addPoiToTourApi, restoreTourApi } from "@/api/tourApi";
import { SearchContext } from "@/context/SearchContext";

const ToursPage = () => {
  const navigate = useNavigate();
  const { searchFilter } = useContext(SearchContext);
  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTour, setIsCreatingTour] = useState(false);
  const [toggleConfirmId, setToggleConfirmId] = useState(null);

  // Fetch tours from API
  useEffect(() => {
    const fetchTours = async () => {
      try {
        setIsLoading(true);
        const data = await getAllToursApi();
        setTours(data || []);
      } catch (err) {
        console.error("Error loading tours:", err);
        setTours([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTours();
  }, []);

  // SEARCH FILTERING EFFECT
  useEffect(() => {
    if (searchFilter?.pageType === "tour" && searchFilter?.query) {
      const searchTerm = searchFilter.query.toLowerCase();
      const filtered = tours.filter(
        (tour) =>
          tour.name?.toLowerCase().includes(searchTerm) ||
          tour.description?.toLowerCase().includes(searchTerm)
      );
      setFilteredTours(filtered);
    } else {
      setFilteredTours(tours);
    }
  }, [searchFilter, tours]);

  // === LOGIC TẠO TOUR VỚI POI ===
  const handleCreateTourWithPOIs = async (tourData) => {
    try {
      setIsCreatingTour(true);
      
      // Tạo tour mới
      const newTour = await createTourApi({
        name: tourData.name,
        description: tourData.description,
        thumbnailUrl: tourData.thumbnailUrl
      });

      // Nếu có POI được chọn, thêm vào tour
      if (tourData.selectedPOIs && tourData.selectedPOIs.length > 0) {
        for (let i = 0; i < tourData.selectedPOIs.length; i++) {
          const poiId = tourData.selectedPOIs[i];
          const stepOrder = i + 1;
          try {
            await addPoiToTourApi(newTour.tourId, {
              PoiId: poiId,
              Title: "", // Title sẽ được lấy từ POI khi query
              StepOrder: stepOrder
            });
          } catch (err) {
            console.error(`Error adding POI ${poiId}:`, err);
            toast.error(`Lỗi khi thêm địa điểm ${i + 1}`);
          }
        }
      }

      setTours([newTour, ...tours]);
      setShowCreateModal(false);
      toast.success("Tạo Tour thành công!");
    } catch (err) {
      console.error("Error creating tour:", err);
      toast.error("Lỗi khi tạo Tour");
    } finally {
      setIsCreatingTour(false);
    }
  };

  const handleToggleTourStatus = async (id) => {
    try {
      setIsLoading(true);
      const tour = tours.find(t => t.tourId === id);
      
      if (tour.isActive) {
        // Ẩn tour
        await deleteTourApi(id);
        setTours(tours.map(t => t.tourId === id ? { ...t, isActive: false } : t));
        toast.success("Ẩn Tour thành công");
      } else {
        // Hiện tour
        await restoreTourApi(id);
        setTours(tours.map(t => t.tourId === id ? { ...t, isActive: true } : t));
        toast.success("Hiện Tour thành công");
      }
      
      setToggleConfirmId(null);
    } catch (err) {
      console.error("Error toggling tour status:", err);
      toast.error("Lỗi khi cập nhật trạng thái Tour");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToDetail = (tourId) => {
    navigate(`/tours/${tourId}`);
  };

  return (
    <div className="p-8 bg-[#FDF8FA]/50 min-h-screen space-y-8 font-sans">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">QUẢN LÝ TOUR</h1>
          <p className="text-gray-500 mt-1 font-medium">Thiết kế và quản lý tour trải nghiệm ẩm thực.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#D81B60] to-[#EC4899] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-pink-100 hover:scale-105 transition-all active:scale-95"
        >
          <Plus size={20} /> Tạo Tour Mới
        </button>
      </div>

      {/* STATS BARS */}
      <div className="grid grid-cols-3 gap-6">
        <Card
            title = "TỔNG SỐ TOUR"
            value = {tours.length}
            color = "text-blue-600"
            sub = "Tất cả các Tour đã tạo"
            icon = {<ExternalLink size={16} className="text-blue-600" />}>
        </Card>
        <Card
            title = "TOUR ĐANG HOẠT ĐỘNG"
            value = {tours.filter(t => t.isActive).length}
            color = "text-green-600"
            sub = "Các Tour đang hoạt động trong hệ thống"
            icon = {<ShieldCheck size={16} className="text-green-600" />}>
        </Card>
        <Card
            title = "TỔNG POI ĐÃ GẮN"
            value = {
              tours.reduce((uniquePois, tour) => {
                tour.pois?.forEach(poi => uniquePois.add(poi.poiId));
                return uniquePois;
              }, new Set()).size
            }
            color = "text-pink-600"
            sub = "Số lượng điểm đến đã được gắn vào các Tour"
            icon = {<MapPin size={16} className="text-pink-600" />} >
        </Card>
      </div>

      {/* GRID LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Đang tải dữ liệu...</div>
        ) : filteredTours.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">Chưa có Tour nào</div>
        ) : (
          filteredTours.map((tour) => (
            <div key={tour.tourId} className={`bg-white rounded-[2.5rem] border shadow-sm overflow-hidden group hover:shadow-xl transition-all ${
              tour.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'
            }`}>
              <div className="relative h-48 w-full overflow-hidden">
                <img src={tour.thumbnailUrl || "https://via.placeholder.com/400x200?text=No+Image"} alt={tour.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>

              <div className="p-8 pt-6 space-y-4">
                <div className="flex justify-between items-center text-left">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    tour.isActive 
                      ? 'bg-green-50 text-green-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tour.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#D81B60] transition-colors line-clamp-1">{tour.name}</h3>
                  <p className="text-gray-400 text-sm mt-2 line-clamp-2 h-10">{tour.description}</p>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500 font-bold text-xs">
                    <MapPin size={16} className="text-pink-500" />
                    <span>{tour.poiCount || 0} POIs</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px]">
                    <Calendar size={14} />
                    <span>{new Date(tour.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={() => handleGoToDetail(tour.tourId)} disabled={!tour.isActive} className={`flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-xl text-xs font-bold transition-all ${
                    tour.isActive
                      ? 'text-gray-600 hover:bg-pink-50 hover:text-pink-600 cursor-pointer'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}>
                     Vào Tour
                  </button>
                  <button onClick={() => setToggleConfirmId(tour.tourId)} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${
                    tour.isActive
                      ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                  }`}>
                    {tour.isActive ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL TẠO TOUR MỚI */}
      <CreateTourModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTourWithPOIs}
        isLoading={isCreatingTour}
      />

      {/* MODAL TOGGLE TOUR STATUS */}
      <ConfirmModal
        open={toggleConfirmId !== null}
        title={tours.find(t => t.tourId === toggleConfirmId)?.isActive ? "Ẩn Tour" : "Hiện Tour"}
        onConfirm={() => toggleConfirmId && handleToggleTourStatus(toggleConfirmId)}
        onCancel={() => setToggleConfirmId(null)}
        confirmText={tours.find(t => t.tourId === toggleConfirmId)?.isActive ? "Ẩn" : "Hiện"}
        cancelText="Hủy"
        message={tours.find(t => t.tourId === toggleConfirmId)?.isActive ? "Bạn có chắc chắn muốn ẩn Tour này?" : "Bạn có chắc chắn muốn hiện Tour này?"}
      />
    </div>
  );
};

export default ToursPage;
