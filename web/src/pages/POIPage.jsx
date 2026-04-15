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
  Plus,
  SquareMenu
} from "lucide-react"

import POIMap from "@/components/POIMap"
import Card from "@/components/Card"
import Filter from "@/components/Filter"
import StatusBadge from "@/components/StatusBadge"
import ConfirmModal from "@/components/ConfirmModal"

import { getAllPOIs, updatePOI, deletePOI } from "@/api/poiApi"
import { getContentsByPOI } from "@/api/contentApi"
import { getMyPoiRequests, getPoiRequestDetail } from "@/api/poiRequestApi"

import useAuth from "@/hooks/useAuth";


export default function POIPage() {

  const { user } = useAuth();
  const role = user?.role;
  const accountId = user?.accountId;

  const [pois, setPois] = useState([])
  const [poiRequests, setPoiRequests] = useState([])
  const [poiRequestDetails, setPoiRequestDetails] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  // PAGINATION STATE FOR REQUESTS
  const [requestsCurrentPage, setRequestsCurrentPage] = useState(1)
  const requestsPerPage = 4

  // Fetch POIs data
  useEffect(() => {
    if (!role || !accountId) {
      setPois([])
      return
    }

    let isMounted = true
    const controller = new AbortController()

    const fetchPOIs = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const res = await getAllPOIs()
        if (!isMounted) return

        // Filter POIs
        const filteredPOIs =
          role === "Owner"
            ? res.filter(p =>
                String(p.accountId) === String(accountId) &&
                p.isActive === true
              )
            : res

        if (!isMounted) return

        // Fetch content for each POI with error handling
        const contentsList = await Promise.allSettled(
          filteredPOIs.map(p => getContentsByPOI(p.poiId))
        )

        if (!isMounted) return

        // Map data with content
        const mapped = filteredPOIs.map((p, index) => {
          const contentResult = contentsList[index]
          const contents = contentResult?.status === 'fulfilled' 
            ? (contentResult.value || [])
            : []
          const masterContent =
            contents.find(c => c.isMaster) || contents[0]
          const title = masterContent?.title || "No name"

          // Extract category
          let categoryName = "Unknown"
          if (p.categoryPois && p.categoryPois.length > 0) {
            const categoryPoi = p.categoryPois[0]
            categoryName =
              categoryPoi?.category?.name ||
              categoryPoi?.categoryName ||
              categoryPoi?.name ||
              "Unknown"
          } else if (p.category) {
            categoryName = p.category?.name || p.category || "Unknown"
          }

          return {
            rank: p.poiId,
            name: title,
            lat: p.latitude,
            lng: p.longitude,
            category: categoryName,
            priority: Number(p.priority),
            isActive: p.isActive
          }
        })

        if (isMounted) {
          setPois(mapped)
          setCurrentPage(1) // Reset pagination
        }
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') {
          console.error("Error fetching POIs:", err)
          setError(err.message)
          setPois([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchPOIs()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [role, accountId])

  // Fetch PoiRequests for Owner
  useEffect(() => {
    if (role !== "Owner" || !accountId) {
      setPoiRequests([])
      setPoiRequestDetails({})
      return
    }

    let isMounted = true
    const controller = new AbortController()

    const fetchPoiRequests = async () => {
      try {
        const requests = await getMyPoiRequests()
        if (isMounted && requests) {
          setPoiRequests(requests)

          // Fetch details for each request
          const detailsMap = {}
          const detailsPromises = requests.map(async (request) => {
            try {
              const detail = await getPoiRequestDetail(request.requestId)
              if (isMounted) {
                detailsMap[request.requestId] = detail
              }
            } catch (err) {
              console.error(`Error fetching detail for request ${request.requestId}:`, err)
            }
          })

          await Promise.all(detailsPromises)
          if (isMounted) {
            setPoiRequestDetails(detailsMap)
          }
        }
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') {
          console.error("Error fetching PoiRequests:", err)
          setPoiRequests([])
        }
      }
    }

    fetchPoiRequests()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [role, accountId])

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

  // PAGINATION LOGIC FOR REQUESTS
  const requestsTotalPages = Math.ceil(poiRequests.length / requestsPerPage)
  const requestsStartIndex = (requestsCurrentPage - 1) * requestsPerPage
  const requestsEndIndex = requestsStartIndex + requestsPerPage

  const currentRequests = poiRequests.slice(requestsStartIndex, requestsEndIndex)

  const goToRequestsPage = (page) => {
    if (page >= 1 && page <= requestsTotalPages) {
      setRequestsCurrentPage(page)
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case "Di tích lịch sử":
        return "bg-blue-100 text-blue-500"

      case "Ẩm thực":
        return "bg-pink-100 text-pink-500"

      case "Hải sản & Ốc":
        return "bg-cyan-100 text-cyan-500"

      case "Cà phê & Giải khát":
        return "bg-orange-100 text-orange-500"

      case "Chùa & Tôn giáo":
        return "bg-purple-100 text-purple-500"

      case "Giải trí":
        return "bg-green-100 text-green-500"

      case "Mua sắm":
        return "bg-yellow-100 text-yellow-600"

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

      if (!poi) {
        console.error("Không tìm thấy POI")
        return
      }

      const newIsActive = !poi.isActive // ✅ boolean

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

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? null : value // toggle
    }))
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
        title="POI KHÔNG HOẠT ĐỘNG" 
        value={pois.filter(p => !p.isActive).length} 
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
          <Filter label="Tất cả" active={true} />
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
                  <div className="flex items-center gap-1">
                    {role === "Admin" && (
                      <button
                          onClick={() => handleHiddenPOI(poi.rank)}
                          className={`w-8 h-8 flex items-center justify-end rounded-full transition-colors text-pink-500`}
                          title={!poi.isActive ? "Hiện POI" : "Ẩn POI"}
                      >
                          {!poi.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
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
      
      {role === "Owner" && (<div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-pink-400"><SquareMenu size={18} /> DANH SÁCH YÊU CẦU</h2>
        </div>
        <table className="w-full text-sm">
          
          <thead className="bg-gray-50 text-gray-400">
            <tr>
              <th className="p-4 text-left">TÊN POI</th>
              <th className="p-4 text-left">LOẠI HÀNH ĐỘNG</th>
              <th className="p-4 text-left">TRẠNG THÁI</th>
              <th className="p-4 text-left">NGÀY TẠO</th>
              <th className="p-4 text-left">GHI CHÚ</th>
              <th className="p-4 text-left">THAO TÁC</th>
            </tr>
          </thead>

          <tbody>
            {poiRequests.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-400">
                  Không có yêu cầu nào
                </td>
              </tr>
            ) : (
              currentRequests.map((request) => {
                let title = "N/A"
                try {
                  const detail = poiRequestDetails[request.requestId]
                  if (detail && detail.proposedData) {
                    const data = typeof detail.proposedData === 'string' 
                      ? JSON.parse(detail.proposedData) 
                      : detail.proposedData
                    title = data.title || data.Title || "N/A"
                  }
                } catch (e) {
                  console.error("Error parsing proposedData:", e)
                }

                const getActionTypeBadge = (type) => {
                  switch (type) {
                    case "CREATE":
                      return "bg-green-100 text-green-600"
                    case "UPDATE":
                      return "bg-blue-100 text-blue-600"
                    case "DELETE":
                      return "bg-red-100 text-red-600"
                    default:
                      return "bg-gray-100 text-gray-600"
                  }
                }

                const getStatusBadge = (status) => {
                  switch (status) {
                    case "PENDING":
                      return "bg-yellow-100 text-yellow-600"
                    case "APPROVED":
                      return "bg-green-100 text-green-600"
                    case "REJECTED":
                      return "bg-red-100 text-red-600"
                    default:
                      return "bg-gray-100 text-gray-600"
                  }
                }

                const formatDate = (dateString) => {
                  const date = new Date(dateString)
                  return date.toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    // hour: '2-digit',
                    // minute: '2-digit'
                  })
                }

                return (
                  <tr key={request.requestId} className="border-t hover:bg-gray-50 transition-all">
                    <td className="p-4">
                      <p className="font-semibold">{title}</p>
                      {request.poiId && (
                        <p className="text-xs text-gray-400">{request.poiId}</p>
                      )}
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionTypeBadge(request.actionType)}`}>
                        {request.actionType}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="text-sm text-gray-600">
                        {formatDate(request.createdAt)}
                      </p>
                    </td>

                    <td className="p-4">
                      {request.rejectReason ? (
                        <p className="text-xs text-red-600 line-clamp-2">
                          {request.rejectReason}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">-</p>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1">
                          <NavLink
                            to={`/pois/requests/${request.requestId}`}
                            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-pink-500 hover:text-pink-600"
                            title="Xem chi tiết POI"
                          >
                            <List size={18} />
                          </NavLink>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        {/* PAGINATION */}
        <div className="flex justify-between items-center p-4 text-sm text-gray-500">
          <p>
            Hiển thị {requestsStartIndex + 1} - {Math.min(requestsEndIndex, poiRequests.length)} của {poiRequests.length} Requests
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToRequestsPage(requestsCurrentPage - 1)}
              disabled={requestsCurrentPage === 1}
              className="p-2 border rounded-lg hover:bg-pink-500 hover:text-white disabled:opacity-50"
            >
              <ChevronLeft size={14} />
            </button>

            {[...Array(requestsTotalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => goToRequestsPage(i + 1)}
                className={`px-3 py-1 rounded-lg ${
                  requestsCurrentPage === i + 1
                    ? "bg-pink-500 text-white"
                    : "border hover:bg-pink-500 hover:text-white"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => goToRequestsPage(requestsCurrentPage + 1)}
              disabled={requestsCurrentPage === requestsTotalPages}
              className="p-2 border rounded-lg hover:bg-pink-500 hover:text-white disabled:opacity-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>

        </div>
      </div>)}

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