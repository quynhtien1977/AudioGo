import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Search, MapPin, Calendar, ShieldCheck,
  MoreVertical, Edit3, EyeOff, Eye, ExternalLink, Trash2, Image as ImageIcon, Clock
} from "lucide-react";

import ConfirmModal from "@/components/ConfirmModal";
import Card from "@/components/Card";

const initialTours = [
  {
    id: 1,
    name: "Hải Sản Đêm Vĩnh Khánh",
    description: "Khám phá các quán hải sản tươi sống đặc trưng nhất dọc tuyến đường Vĩnh Khánh về đêm.",
    poiCount: 5,
    createdAt: "2024-03-15 14:00",
    status: "Active",
    thumbnail: "https://datviettour.com.vn/uploads/images/tin-tuc-SEO/mien-bac/ha-long/dac-san/cac-mon-hai-san-duoc-che-bien.jpg",
    isHidden: false
  },
  {
    id: 2,
    name: "Tour Ăn Vặt Sinh Viên",
    description: "Tổng hợp các món ăn ngon - bổ - rẻ phù hợp cho giới trẻ và sinh viên trải nghiệm.",
    poiCount: 8,
    createdAt: "2024-03-18 09:30",
    status: "Draft",
    thumbnail: "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&q=80&w=400",
    isHidden: true
  }
];

const ToursPage = () => {
  const [tours, setTours] = useState(initialTours);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // State cho Tour mới
  const [newTourData, setNewTourData] = useState({
    name: "",
    description: "",
    thumbnail: "",
    totalTime: ""
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // === LOGIC TẠO TOUR ===
  const handleCreateTour = () => {
    if (!newTourData.name) return alert("Vui lòng nhập tên hành trình");

    const newTour = {
      id: tours.length + 1,
      ...newTourData,
      poiCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: "Draft",
      isHidden: false
    };

    setTours([newTour, ...tours]);
    setShowCreateModal(false);
    setNewTourData({ name: "", description: "", thumbnail: "", totalTime: "" }); // Reset form
  };

  const toggleHideTour = (id) => {
    setTours(tours.map(t => t.id === id ? { ...t, isHidden: !t.isHidden } : t));
    setOpenDropdownId(null);
  };

  const handleGoToDetail = (id) => {
    navigate(`/tours/${id}`);
  };

  return (
    <div className="p-8 bg-[#FDF8FA]/50 min-h-screen space-y-8 font-sans">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">QUẢN LÝ HÀNH TRÌNH</h1>
          <p className="text-gray-500 mt-1 font-medium">Thiết kế và quản lý lộ trình trải nghiệm ẩm thực.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#D81B60] to-[#EC4899] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-pink-100 hover:scale-105 transition-all active:scale-95"
        >
          <Plus size={20} /> Tạo Lộ Trình Mới
        </button>
      </div>

      {/* STATS BARS */}
      <div className="grid grid-cols-3 gap-6">
        <Card
            title = "TỔNG SỐ HÀNH TRÌNH"
            value = {tours.length}
            color = "text-blue-600"
            sub = "Tất cả các hành trình đã tạo"
            icon = {<ExternalLink size={16} className="text-blue-600" />}>
        </Card>
        <Card
            title = "HÀNH TRÌNH ĐANG HOẠT ĐỘNG"
            value = "12"
            color = "text-green-600"
            sub = "Các hành trình đang hoạt động trong hệ thống"
            icon = {<ShieldCheck size={16} className="text-green-600" />}>
        </Card>
        <Card
            title = "TỔNG POI ĐÃ GẮN"
            value = "48"
            color = "text-pink-600"
            sub = "Số lượng điểm đến đã được gắn vào các hành trình"
            icon = {<MapPin size={16} className="text-pink-600" />} >
        </Card>
      </div>

      {/* GRID LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tours.map((tour) => (
          <div key={tour.id} className={`bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all ${tour.isHidden ? 'opacity-60' : ''}`}>
            <div className="relative h-48 w-full overflow-hidden">
              <img src={tour.thumbnail || "https://via.placeholder.com/400x200?text=No+Image"} alt={tour.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>

            <div className="p-8 pt-6 space-y-4">
              <div className="flex justify-between items-center text-left">
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tour.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {tour.status}
                </div>
                {tour.isHidden && <span className="text-[10px] font-bold text-red-500 flex items-center gap-1 uppercase tracking-widest"><EyeOff size={12}/> Đang ẩn</span>}
              </div>

              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#D81B60] transition-colors line-clamp-1">{tour.name}</h3>
                <p className="text-gray-400 text-sm mt-2 line-clamp-2 h-10">{tour.description}</p>
              </div>

              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500 font-bold text-xs">
                  <MapPin size={16} className="text-pink-500" />
                  <span>{tour.poiCount} POIs</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px]">
                  <Calendar size={14} />
                  <span>{tour.createdAt}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => handleGoToDetail(tour.id)} className="flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-pink-50 hover:text-pink-600 transition-all">
                   Vào Tour
                </button>
                <button onClick={() => toggleHideTour(tour.id)} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${tour.isHidden ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                  {tour.isHidden ? <><Eye size={14} /> Hiện</> : <><EyeOff size={14} /> Ẩn</>}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL TẠO TOUR MỚI */}
      <ConfirmModal
        open={showCreateModal}
        title={null}
        onConfirm={handleCreateTour}
        onCancel={() => setShowCreateModal(false)}
        confirmText="Tạo ngay"
        cancelText="Hủy bỏ"
        message={
          <div className="w-full text-left">
            <h2 className="text-xl font-black text-gray-800 border-b pb-4 mb-6">Tạo Hành trình Mới</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tên hành trình</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Tour Hải Sản 1"
                  className="w-full p-4 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-pink-100 font-bold"
                  value={newTourData.name}
                  onChange={(e) => setNewTourData({...newTourData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Mô tả</label>
                <textarea 
                  placeholder="Mô tả ngắn về trải nghiệm..."
                  className="w-full p-4 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-pink-100 h-24 resize-none"
                  value={newTourData.description}
                  onChange={(e) => setNewTourData({...newTourData, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Thời gian (phút)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="90"
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-pink-100"
                      value={newTourData.totalTime}
                      onChange={(e) => setNewTourData({...newTourData, totalTime: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">URL Ảnh Thumbnail</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="https://..."
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-pink-100"
                      value={newTourData.thumbnail}
                      onChange={(e) => setNewTourData({...newTourData, thumbnail: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default ToursPage;
