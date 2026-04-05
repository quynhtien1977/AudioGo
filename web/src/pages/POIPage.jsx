import { useEffect, useState } from "react"
import { NavLink } from "react-router-dom"
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle,
  Eye,
  EyeOff,
  List,
  CircleX,
  Trash,
  Plus
} from "lucide-react"

import POIMap from "@/components/POIMap"
import Card from "@/components/Card"
import Filter from "@/components/Filter"
import StatusBadge from "@/components/StatusBadge"
import ConfirmModal from "@/components/ConfirmModal"

import { getTopPOIs } from "@/api/poiApi"

import useAuth from "@/hooks/useAuth";


export default function POIPage() {

  const { user } = useAuth();
  const role = user?.role;

  const [pois, setPois] = useState([])

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  useEffect(() => {
    getTopPOIs().then(setPois)
  }, [])

  // PAGINATION LOGIC
  const totalItems = pois.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  const currentPOIs = pois.slice(startIndex, endIndex)

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
        case "Restaurant":
        return "bg-pink-100 text-pink-500"
        case "Cafe":
        return "bg-orange-100 text-orange-500"
        case "Museum":
        return "bg-blue-100 text-blue-500"
        default:
        return "bg-gray-100 text-gray-500"
    }
    }

    // xử lý duyệt POI
  const handleApprove = (id) => {
    setPois((prev) =>
      prev.map((p) =>
        p.rank === id ? { ...p, status: "APPROVED" } : p
      )
    )
  }

  const handleReject = (id) => {
    setPois((prev) =>
      prev.map((p) =>
        p.rank === id ? { ...p, status: "REJECTED" } : p
      )
    )
  }

  const handleSetPriority = (id, newPriority) => {
    setPois((prev) =>
      prev.map((p) =>
        p.rank === id ? { ...p, priority: newPriority } : p
      )
    )
  }

  const getPriorityColor = (value) => {
    switch (value) {
      case "CRITICAL": return "bg-red-100 text-red-500"
      case "HIGH": return "bg-yellow-100 text-yellow-600"
      case "MEDIUM": return "bg-gray-200 text-gray-600"
      case "LOW": return "bg-gray-100 text-gray-400"
      default: return ""
    }
  }

  const handleHiddenPOI = (id) => {
    setPois((prev) =>
    prev.map((p) =>
      p.rank === id 
        ? { ...p, status: p.status === "INACTIVE" ? "APPROVED" : "INACTIVE" } 
        : p
    )
  )
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState(null);

  const openDeleteConfirm = (id) => {
      setSelectedPoiId(id);
      setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
      // Logic xử lý API xóa/gửi yêu cầu tại đây
      console.log("Gửi yêu cầu xóa POI ID:", selectedPoiId);
      
      setShowDeleteModal(false);
      // Toast thông báo thành công...
  };

  return (
    <div className="p-6 bg-pink-50/30 min-h-screen space-y-6">

      <h1 className="text-2xl font-bold">QUẢN LÝ DỮ LIỆU POIs</h1>

      {/* STATCARD */}
      <div className="grid grid-cols-3 gap-6">
        <Card 
          title="TỔNG SỐ POIs" 
          value={totalItems} 
          sub="hiện có trong hệ thống" 
        />
        <Card 
        title="CHỜ DUYỆT" 
        value={pois.filter(p => p.status === "PENDING").length} 
        sub="Cần xem xét" color="text-orange-500" />

        <Card 
          title="ƯU TIÊN CAO" 
          value={pois.filter(p => p.priority === "CRITICAL").length} 
          sub="quản lý mức độ ưu tiên" 
          color="text-red-500" 
        />
      </div>

      {/* FILTER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border">
        <div className="flex gap-3">
          <Filter label="Trạng thái: Tất cả" active />
          <Filter label="Thể loại: Đồ ăn & Nước uống" />
          <Filter label="Độ ưu tiên: Cao" />
          <Filter label="Lọc" icon={<SlidersHorizontal size={14} />} />
        </div>
        <div className="text-sm text-gray-500">
          Sắp bởi: <span className="font-semibold text-gray-700">Lần cập nhật mới nhất</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          
          <thead className="bg-gray-50 text-gray-400">
            <tr>
              <th className="p-4 text-left">TÊN</th>
              <th className="p-4 text-left">THỂ LOẠI</th>
              <th className="p-4 text-left">VỊ TRÍ</th>
              <th className="p-4 text-left">ĐỘ ƯU TIÊN</th>
              <th className="p-4 text-left">TRẠNG THÁI</th>

              {role === "ADMIN" && (
                <>
                  <th className="p-4 text-left">DUYỆT</th>
                </>
              )}
              <th className="p-4 text-left">THAO TÁC</th>
            </tr>
          </thead>

          <tbody>
            {currentPOIs.map((poi) => (
              <tr key={poi.rank} 
                  className={`border-t transition-all ${
                    poi.status === "INACTIVE" 
                      ? "opacity-40 grayscale bg-gray-50" 
                      : "hover:bg-gray-50"
                  }`}>

                <td className="p-4">
                  <p className="font-semibold">{poi.name}</p>
                  <p className="text-xs text-gray-400">ID: POI-{poi.rank}</p>
                </td>

                <td>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(poi.category)}`}>
                    {poi.category}
                  </span>
                </td>

                <td className="p-4">
                  <p className="text-s text-gray-400">
                    {poi.lat}, {poi.lng}
                  </p>
                </td>

                <td className="p-4">
                  {role === "ADMIN" ? (
                    <select
                      value={poi.priority}
                      onChange={(e) => handleSetPriority(poi.rank, e.target.value)}
                      className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(poi.priority)}`}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(poi.priority)}`}>
                      {poi.priority}
                    </span>
                  )}
                </td>

              
                <td className="p-4">
                  <StatusBadge value={poi.status} />
                </td>


                {role === "ADMIN" && (
                  <td className="p-4 flex items-center gap-2">
                      {poi.status === "PENDING" && (
                        <button
                          onClick={() => handleApprove(poi.rank)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-pink-100 text-pink-500 hover:bg-pink-200"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}

                      {poi.status === "PENDING" && (
                        <button
                          onClick={() => handleReject(poi.rank)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:text-red-600 hover:bg-red-200"
                        >
                          <CircleX size={16} />
                        </button>
                      )}

                      {poi.status === "APPROVED" && (
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-400">
                          <CheckCircle size={16} />
                        </div>
                      )}

                      {poi.status === "REJECTED" && (
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-400">
                          <CircleX size={16} />
                        </div>
                      )}
                  </td>
                )}
                  
                <td className="p-4">  
                  <div className="flex items-center gap-1">
                    {role === "ADMIN" && (
                      <button
                          onClick={() => handleHiddenPOI(poi.rank)}
                          className={`w-8 h-8 flex items-center justify-end rounded-full transition-colors text-pink-500`}
                          title={poi.status === "INACTIVE" ? "Hiện POI" : "Ẩn POI"}
                      >
                          {poi.status === "INACTIVE" ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>)}

                      {role === "MANAGER" && (
                        <button
                            onClick={() => openDeleteConfirm(poi.rank)}
                            className={`w-8 h-8 flex items-center justify-end rounded-full transition-colors text-pink-500`}
                        >
                            <Trash size={18}/>
                        </button>
                    )}

                    <NavLink
                      to={`/pois/${poi.rank}`}
                      className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-pink-500 hover:text-pink-600"
                      title="Xem chi tiết POI"
                      >
                      <List size={18} />
                    </NavLink>

                  </div>

                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex justify-between items-center p-4 text-sm text-gray-500">
          <p>
            Hiển thị {startIndex + 1} - {Math.min(endIndex, totalItems)} của {totalItems} POIs
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border rounded-lg hover:bg-pink-500 hover:text-white disabled:opacity-50"
            >
              <ChevronLeft size={14} />
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`px-3 py-1 rounded-lg ${
                  currentPage === i + 1
                    ? "bg-pink-500 text-white"
                    : "border hover:bg-pink-500 hover:text-white"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border rounded-lg hover:bg-pink-500 hover:text-white disabled:opacity-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>

        </div>

      </div>

      <div className="flex justify-end items-center mb-6">

        {role === "MANAGER" && (
          <NavLink
            to="/pois/add"
            className="group flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-2xl font-bold 
                      shadow-lg shadow-pink-200 hover:bg-pink-600 hover:shadow-pink-300 
                      transition-all duration-300 uppercase text-[10px] tracking-widest"
            >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            Thêm POI mới
          </NavLink>
        )}
        
      </div>

      {/* MAP */}
      <div className="bg-white p-6 rounded-2xl border">
        <h2 className="font-semibold mb-4">Map POI</h2>
        <POIMap pois={pois} />
      </div>

      {/* Modal Pop-up */}
      { showDeleteModal && (
        <ConfirmModal
          open={showDeleteModal}
          title="Xác nhận xóa?"
          message="Hệ thống sẽ gửi yêu cầu phê duyệt xóa điểm này đến Quản trị viên (Admin). Bạn có muốn tiếp tục?"
          confirmText="Gửi yêu cầu"
          cancelText="Hủy bỏ"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
      
    </div>
  )
}