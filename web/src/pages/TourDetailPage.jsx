import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Hook điều hướng
import { 
  ArrowLeft, Edit3, Trash2, MapPin, Clock, 
  Plus, GripVertical, Save, Star, Users, 
  TrendingUp, BarChart3, Share2, X, Search, Image as ImageIcon, Loader2
} from "lucide-react";

import POIMapPreview from "@/components/POIMapPreview";
import ConfirmModal from "@/components/ConfirmModal";

const availablePOIs = [
  { id: 101, name: "Ốc Đào", address: "212 Vĩnh Khánh" },
  { id: 102, name: "Ốc Oanh", address: "534 Vĩnh Khánh" },
  { id: 103, name: "Ốc Vũ", address: "37 Vĩnh Khánh" },
  { id: 104, name: "Lẩu bò Khu Nhà Cháy", address: "001 Chung cư vĩnh khánh" },
  { id: 105, name: "Sushi Viên 1k", address: "188 Vĩnh Khánh" },
];

const TourDetailPage = () => {
  const navigate = useNavigate(); // Khởi tạo điều hướng
  const [isSaving, setIsSaving] = useState(false); // Trạng thái lưu dữ liệu

  const [tour, setTour] = useState({
    id: "TOUR-04",
    name: "Hành Trình Ốc Đêm Vĩnh Khánh",
    description: "Trải nghiệm 3 quán ốc đỉnh nhất Quận 4 trong một lộ trình tối giản, tiết kiệm thời gian nhưng vẫn đủ vị.",
    status: "Active",
    thumbnail: "https://datviettour.com.vn/uploads/images/tin-tuc-SEO/mien-bac/ha-long/dac-san/cac-mon-hai-san-duoc-che-bien.jpg",
    createdAt: "2024-03-20",
    totalTime: "120 phút",
    pois: [
      { id: 1, name: "Ốc Đào", address: "212 Vĩnh Khánh", order: 1, type: "Cửa hàng chính" },
      { id: 2, name: "Ốc Oanh", address: "534 Vĩnh Khánh", order: 2, type: "Điểm dừng chân" },
      { id: 3, name: "Ốc Vũ", address: "37 Vĩnh Khánh", order: 3, type: "Điểm kết thúc" },
    ]
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editFormData, setEditFormData] = useState({ ...tour });

  // === LOGIC QUAY LẠI ===
  const handleGoBack = () => {
    navigate("/tours");
  };

  // === LOGIC LƯU THAY ĐỔI TỔNG THỂ ===
  const handleFinalSave = async () => {
    setIsSaving(true);
    // Giả lập gọi API lưu toàn bộ Tour và thứ tự POI
    setTimeout(() => {
      setIsSaving(false);
      alert("Đã lưu mọi thay đổi vào hệ thống thành công!");
    }, 1500);
  };

  // === LOGIC CHỈNH SỬA THÔNG TIN CHI TIẾT (FORM) ===
  const handleOpenEdit = () => {
    setEditFormData({ ...tour });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    setTour({ ...editFormData });
    setShowEditModal(false);
  };

  // === LOGIC QUẢN LÝ POI ===
  const handleDeletePOI = (id) => {
    setTour(prev => ({
      ...prev,
      pois: prev.pois.filter(p => p.id !== id)
    }));
  };

  const handleAddPOI = (poi) => {
    if (tour.pois.find(p => p.id === poi.id)) return;
    setTour(prev => ({
      ...prev,
      pois: [...prev.pois, { ...poi, type: "Điểm dừng chân", order: prev.pois.length + 1 }]
    }));
    setShowAddModal(false);
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
        <div className="flex gap-3">
          <button 
            onClick={handleOpenEdit}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <Edit3 size={18} /> Chỉnh sửa Tour
          </button>
          
          <button 
            onClick={handleFinalSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D81B60] to-[#EC4899] text-white rounded-2xl font-bold shadow-lg shadow-pink-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save size={18} /> Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Cột trái: Thông tin và danh sách địa điểm */}
        <div className="col-span-7 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative h-64">
              <img src={tour.thumbnail} className="w-full h-full object-cover" alt="tour" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-10">
                <div>
                  <span className="bg-pink-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Tour ID: {tour.id}</span>
                  <h1 className="text-3xl font-black text-white mt-2">{tour.name}</h1>
                </div>
              </div>
            </div>
            <div className="p-10 space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Mô tả Tour</h3>
              <p className="text-gray-500 leading-relaxed italic">"{tour.description}"</p>
              <div className="flex gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="text-pink-500" size={18} />
                  <span className="text-sm font-bold text-gray-700">Ước tính: {tour.totalTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="text-pink-500" size={18} />
                  <span className="text-sm font-bold text-gray-700">{tour.pois.length} Địa điểm</span>
                </div>
              </div>
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
              {tour.pois.map((poi, index) => (
                <div key={poi.id} className="group flex items-center gap-4 p-5 bg-gray-50 rounded-[1.5rem] border border-transparent hover:border-pink-200 hover:bg-pink-50/30 transition-all">
                  <div className="cursor-grab text-gray-300 group-hover:text-pink-400"><GripVertical size={20} /></div>
                  <div className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center font-black text-pink-500 shadow-sm">{index + 1}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{poi.name}</h4>
                    <p className="text-xs text-gray-400">{poi.address}</p>
                  </div>
                  <button onClick={() => handleDeletePOI(poi.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
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
            <h3 className="font-bold text-gray-800 tracking-tight">Bản đồ Tour</h3>
            <POIMapPreview pois={tour.pois} />
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
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
          </div>
        </div>
      </div>

      {/* MODALS */}
      <ConfirmModal
        open={showEditModal}
        title={null}
        onConfirm={handleSaveEdit}
        onCancel={() => setShowEditModal(false)}
        confirmText="Cập nhật"
        cancelText="Hủy bỏ"
        message={
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Thời gian (phút)</label>
                  <input type="text" className="w-full p-4 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-pink-100" value={editFormData.totalTime} onChange={(e) => setEditFormData({ ...editFormData, totalTime: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Link ảnh Thumbnail</label>
                  <input type="text" className="w-full p-4 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-pink-100" value={editFormData.thumbnail} onChange={(e) => setEditFormData({ ...editFormData, thumbnail: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
        }
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
                {availablePOIs.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((poi) => (
                   <div key={poi.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                         <p className="font-bold text-sm text-gray-700">{poi.name}</p>
                         <p className="text-[10px] text-gray-400 uppercase">{poi.address}</p>
                      </div>
                      <button onClick={() => handleAddPOI(poi)} className="px-4 py-2 bg-white text-pink-500 border border-pink-200 rounded-lg text-xs font-bold hover:bg-pink-500 hover:text-white transition-all"> Thêm </button>
                   </div>
                ))}
             </div>
          </div>
        }
      />
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