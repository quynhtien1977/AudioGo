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

import { getAllPOIs, updatePOI, deletePOI } from "@/api/poiApi"
import { getContentsByPOI } from "@/api/contentApi"

import useAuth from "@/hooks/useAuth";


export default function POIPage() {

  const { user } = useAuth();
  const role = user?.role;

  const [pois, setPois] = useState([])

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  // PAGINATION LOGIC
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAllPOIs()
        const contentsList = await Promise.all(
          res.map(p => getContentsByPOI(p.poiId))
        )

        // setPois(mapped)
        const mapped = res.map((p, index) => {
        const contents = contentsList[index] || []

        const masterContent =
          contents.find(c => c.isMaster) || contents[0]

        const title =
          masterContent?.title || "No name"

          return {
            rank: p.poiId,

            name: title,

            lat: p.latitude,
            lng: p.longitude,

            category: p.categoryPois?.[0]?.category?.name || "Unknown",

            priority: Number(p.priority),
            status: p.status,

            isActive: p.isActive
          }
        })
        setPois(mapped)
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [])

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
  const handleApprove = async (id) => {
    try {
      await updatePOI(id, { status: "APPROVED" })

      setPois(prev =>
        prev.map(p =>
          p.rank === id ? { ...p, status: "APPROVED" } : p
        )
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleReject = async (id) => {
    try {
      await updatePOI(id, { status: "REJECTED" })

      setPois(prev =>
        prev.map(p =>
          p.rank === id ? { ...p, status: "REJECTED" } : p
        )
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleSetPriority = async (id, newPriority) => {
    try {
      await updatePOI(id, { priority: newPriority })

      setPois(prev =>
        prev.map(p =>
          p.rank === id ? { ...p, priority: newPriority } : p
        )
      )
    } catch (err) {
      console.error(err)
    }
  }

  const getPriorityColor = (value) => {
    switch (value) {
      case 4: return "bg-red-100 text-red-500"
      case 3: return "bg-yellow-100 text-yellow-600"
      case 2: return "bg-gray-200 text-gray-600"
      case 1: return "bg-gray-100 text-gray-400"
      default: return ""
    }
  }

  const handleHiddenPOI = async (id) => {
  try {
    const poi = pois.find(p => p.rank === id)

    const newIsActive = poi.isActive === 1 ? 0 : 1

    await updatePOI(id, {
      isActive: newIsActive
    })

    setPois(prev =>
      prev.map(p =>
        p.rank === id
          ? { ...p, isActive: newIsActive }
          : p
      )
    )

  } catch (err) {
    console.error(err)
  }
}

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState(null);

  const openDeleteConfirm = (id) => {
      setSelectedPoiId(id);
      setShowDeleteModal(true);
  };


  const handleConfirmDelete = async () => {
    try {
      await deletePOI(selectedPoiId)

      setPois(prev => prev.filter(p => p.rank !== selectedPoiId))
    } catch (err) {
      console.error(err)
    }

    setShowDeleteModal(false)
  }

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApproveId, setSelectedApproveId] = useState(null);
  const [selectedRejectId, setSelectedRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const openApproveConfirm = (id) => {
    setSelectedApproveId(id);
    setShowApproveModal(true);
  };

  const openRejectConfirm = (id) => {
    setSelectedRejectId(id);
    setShowRejectModal(true);
  };

  const handleConfirmApprove = () => {
    handleApprove(selectedApproveId);
    setShowApproveModal(false);
  };

  const handleConfirmReject = () => {
    handleReject(selectedRejectId);
    console.log("Reason for rejection:", rejectReason);
    setShowRejectModal(false);
    setRejectReason("");
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
          value={pois.filter(p => p.priority === 4).length} 
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

              {role === "Admin" && (
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
                    !poi.isActive 
                      ? "opacity-40 grayscale bg-gray-50" 
                      : "hover:bg-gray-50"
                  }`}>

                <td className="p-4">
                  <p className="font-semibold">{poi.name}</p>
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
                  {role === "Admin" ? (
                    <select
                      value={poi.priority}
                      onChange={(e) => handleSetPriority(poi.rank, Number(e.target.value))}
                      className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(poi.priority)}`}
                    >
                      <option value={1}>LOW</option>
                      <option value={2}>MEDIUM</option>
                      <option value={3}>HIGH</option>
                      <option value={4}>CRITICAL</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(poi.priority)}`}>
                      {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][poi.priority - 1]}
                    </span>
                  )}
                </td>

              
                <td className="p-4">
                  <StatusBadge value={poi.status} />
                </td>


                {role === "Admin" && (
                  <td className="p-4 flex items-center gap-2">
                      {poi.status === "PENDING" && (
                        <button
                          onClick={() => openApproveConfirm(poi.rank)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-pink-100 text-pink-500 hover:bg-pink-200"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}

                      {poi.status === "PENDING" && (
                        <button
                          onClick={() => openRejectConfirm(poi.rank)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:text-red-600 hover:bg-red-200"
                        >
                          <CircleX size={16} />
                        </button>
                      )}

                      {poi.status === "APPROVED" && (
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-200 text-green-500">
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
                    {role === "Admin" && (
                      <button
                          onClick={() => handleHiddenPOI(poi.rank)}
                          className={`w-8 h-8 flex items-center justify-end rounded-full transition-colors text-pink-500`}
                          title={poi.status === "INACTIVE" ? "Hiện POI" : "Ẩn POI"}
                      >
                          {poi.isActive === 0 ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>)}

                      {role === "Owner" && (
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

        {role === "Owner" && (
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
        <h2 className="font-semibold mb-4">Bản đồ vị trí POI</h2>
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
      
      { showApproveModal && (
        <ConfirmModal
          open={showApproveModal}
          title="Xác nhận duyệt?"
          message="Bạn có chắc chắn muốn duyệt POI này không?"
          confirmText="Duyệt"
          cancelText="Hủy bỏ"
          onConfirm={handleConfirmApprove}
          onCancel={() => setShowApproveModal(false)}
        />
      )}
      
      { showRejectModal && (
        <ConfirmModal
          open={showRejectModal}
          title="Xác nhận từ chối?"
          message={
            <div>
              <p>Bạn có chắc chắn muốn từ chối POI này không?</p>
              <textarea
                className="w-full mt-2 p-2 border rounded"
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          }
          confirmText="Từ chối"
          cancelText="Hủy bỏ"
          onConfirm={handleConfirmReject}
          onCancel={() => setShowRejectModal(false)}
        />
      )}
      
    </div>
  )
}