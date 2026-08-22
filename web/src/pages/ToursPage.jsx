import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, MapPin, Calendar, ShieldCheck, Eye, ExternalLink, Trash2, Route
} from "lucide-react"
import PageLoader from "@/components/PageLoader";
import toast from "react-hot-toast";

import ConfirmModal from "@/components/ConfirmModal";
import CreateTourModal from "@/components/CreateTourModal";
import EmptyState from "@/components/EmptyState";
import StatsCard from "@/components/StatsCard";
import PageHeader from "@/components/PageHeader";
import HelpGuide from "@/components/HelpGuide";
import { getAllToursApi, createTourApi, deleteTourApi, addPoiToTourApi, restoreTourApi } from "@/api/tourApi";
import { SearchContext } from "@/context/SearchContext";
import { formatDateVN } from "@/utils/formatDate";

const ToursPage = () => {
  const navigate = useNavigate();
  const { searchFilter } = useContext(SearchContext);
  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTour, setIsCreatingTour] = useState(false);
  const [toggleConfirmId, setToggleConfirmId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState(null);

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
        navigate(`/admin/tours/${tourId}`);
  };

  const openDeleteConfirm = (id) => {
    setSelectedTourId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsLoading(true);
      await deleteTourApi(selectedTourId);
      setTours(prev => prev.filter(t => t.tourId !== selectedTourId));
      toast.success("Xóa Tour thành công");
    } catch (err) {
      console.error("Error deleting tour:", err);
      toast.error(err?.response?.data || "Xóa Tour thất bại");
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <PageHeader
        title="QUẢN LÝ TOUR"
        description="Thiết kế và quản lý tour trải nghiệm ẩm thực."
        icon={<Route size={24} />}
        actionButton={
          <div className="flex items-center gap-2">
            <HelpGuide
              title="Hướng dẫn Quản lý Tour Ẩm thực"
              steps={[
                "Bấm <strong>Tạo Tour Mới</strong> để bắt đầu thiết kế hành trình ẩm thực mới.",
                "Nhấp <strong>Vào Tour</strong> để xem chi tiết, thêm/xóa POI hoặc sắp xếp lại thứ tự ghé thăm.",
                "Dùng nút <strong>Ẩn / Hiện</strong> để bật/tắt hiển thị tour trên ứng dụng di động cho du khách."
              ]}
              tips={[
                "Một tour nên có từ 3 - 5 địa điểm ẩm thực đặc sắc gần nhau.",
                "Có thể ẩn tour tạm thời khi các địa điểm trong tour đang bảo trì hoặc sửa đổi."
              ]}
            />
            <button 
              onClick={() => navigate('/tours/create')}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-pink-100 hover:shadow-lg transition-all text-sm"
            >
              <Plus size={18} /> Tạo Tour Mới
            </button>
          </div>
        }
      />

      {/* STATS BARS */}
      <div className="grid grid-cols-3 gap-6">
        <StatsCard
          title="TỔNG SỐ TOUR"
          value={tours.length}
          sub="Tất cả các Tour đã tạo"
          icon={<ExternalLink size={16} />}
        />
        <StatsCard
          title="TOUR ĐANG HOẠT ĐỘNG"
          value={tours.filter(t => t.isActive).length}
          sub="Các Tour đang hoạt động trong hệ thống"
          icon={<ShieldCheck size={16} />}
        />
        <StatsCard
          title="TỔNG POI ĐÃ GẮN"
          value={
            tours.reduce((uniquePois, tour) => {
              tour.pois?.forEach(poi => uniquePois.add(poi.poiId));
              return uniquePois;
            }, new Set()).size
          }
          sub="Số lượng điểm đến đã được gắn vào các Tour"
          icon={<MapPin size={16} />}
        />
      </div>

      {/* GRID LIST */}
      {isLoading ? (
        <PageLoader text="Đang tải dữ liệu tours..." />
      ) : filteredTours.length === 0 ? (
        <EmptyState
          icon={<Route size={40} />}
          title="Không tìm thấy Tour nào"
          description="Thử thay đổi từ khóa tìm kiếm hoặc tạo một tour trải nghiệm mới để bắt đầu."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
          {filteredTours.map((tour) => (
            <div key={tour.tourId} className={`bg-white rounded-[2.5rem] border shadow-sm overflow-hidden group hover:shadow-xl transition-all ${
              tour.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'
            }`}>
              <div className="relative h-48 w-full overflow-hidden">
                <img src={tour.thumbnailUrl || "https://via.placeholder.com/400x200?text=No+Image"} alt={tour.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteConfirm(tour.tourId);
                  }}
                  className="absolute top-4 right-4 bg-white/95 hover:bg-red-50 text-red-500 p-2.5 rounded-full border border-red-100 shadow-md hover:scale-110 active:scale-95 transition-all z-10"
                  title="Xóa Tour"
                >
                  <Trash2 size={16} />
                </button>
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
                    <span>{formatDateVN(tour.createdAt, false)}</span>
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
          ))}
        </div>
      )}

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

      {/* MODAL DELETE TOUR */}
      {showDeleteModal && (
        <ConfirmModal
          open={showDeleteModal}
          variant="danger"
          title="Xác nhận xóa Tour"
          message="Tour sẽ bị xóa mềm (ẩn khỏi danh sách). Bạn có thể khôi phục lại sau nếu cần."
          confirmText="Xóa Tour"
          cancelText="Hủy"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default ToursPage;
