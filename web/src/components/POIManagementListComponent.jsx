import {
  ArrowLeft,
  ChartBarStacked,
  Calendar1,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  CalendarDays,
  X,
} from "lucide-react"
import { useState, useContext, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { SearchContext } from "@/context/SearchContext"

// Helper: sort POI list theo status (pending trước)
const sortPoiByStatus = (poiList) => {
  return [...poiList].sort((a, b) => {
    const statusOrder = { pending: 0, approved: 1, rejected: 2 }
    return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0)
  })
}

// Helper: badge style theo status
const getStatusBadgeStyle = (status) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700"
    case "rejected":
      return "bg-red-100 text-red-700"
    case "pending":
    default:
      return "bg-yellow-100 text-yellow-700"
  }
}

// Helper: label status
const getStatusLabel = (status) => {
  switch (status) {
    case "approved":
      return "✓ Đã phê duyệt"
    case "rejected":
      return "✕ Từ chối"
    case "pending":
    default:
      return "⏱ Chờ xử lý"
  }
}

export default function POIManagementListComponent({
  title,
  description,
  backPath = "/poi/management",
  type = "new", // "new" | "update" | "deletion"
  badgeColor = "bg-blue-100",
  badgeTextColor = "text-blue-700",
  hoverBg = "hover:bg-blue-50/30",
  poiList = [],
  loading = false,
  renderExtraInfo, // Function: (poi) => JSX
  renderActions,   // Function: (poi) => JSX – chỉ dùng cho pending
  renderReviewAction, // Function: (poi) => JSX – nút xem lại cho approved/rejected
  emptyMessage = "Không có dữ liệu",
  warningNote,
  statsLabel = "chờ xử lý",
}) {
  const navigate = useNavigate()
  const { searchFilter } = useContext(SearchContext)

  // Tab filter: "all" | "pending" | "approved" | "rejected"
  const [activeTab, setActiveTab] = useState("all")

  // Date filter
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Sort + search + tab + date filter (memoized)
  const filteredList = useMemo(() => {
    let result = sortPoiByStatus(poiList)

    // Search filter (từ Topbar)
    if (searchFilter?.pageType === "poi-management" && searchFilter?.query) {
      const q = searchFilter.query.toLowerCase()
      result = result.filter(
        poi =>
          poi.name?.toLowerCase().includes(q) ||
          poi.requester?.toLowerCase().includes(q) ||
          poi.category?.toLowerCase().includes(q)
      )
    }

    // Tab filter
    if (activeTab !== "all") {
      result = result.filter(poi => poi.status === activeTab)
    }

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom)
      from.setHours(0, 0, 0, 0)
      result = result.filter(poi => {
        const d = new Date(poi.requestedAt || poi.createdAt)
        return d >= from
      })
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      result = result.filter(poi => {
        const d = new Date(poi.requestedAt || poi.createdAt)
        return d <= to
      })
    }

    return result
  }, [poiList, searchFilter, activeTab, dateFrom, dateTo])

  // Stats (trên toàn bộ poiList, không bị ảnh hưởng bởi filter/search)
  const pendingCount  = poiList.filter(poi => poi.status === "pending").length
  const approvedCount = poiList.filter(poi => poi.status === "approved").length
  const rejectedCount = poiList.filter(poi => poi.status === "rejected").length

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const totalPages = Math.ceil(filteredList.length / itemsPerPage)

  const startIndex = (currentPage - 1) * itemsPerPage
  const currentItems = filteredList.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Đổi tab / filter → reset page 1
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const clearDateFilter = () => {
    setDateFrom("")
    setDateTo("")
    setCurrentPage(1)
  }

  const hasDateFilter = dateFrom || dateTo

  // Accent color theo type
  const backHoverColor =
    type === "new" ? "hover:bg-blue-100"
    : type === "update" ? "hover:bg-amber-100"
    : "hover:bg-red-100"

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(backPath)}
          className={`p-2 rounded-full transition ${backHoverColor}`}
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-xl text-yellow-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-gray-500 font-medium">Đang chờ</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-xl text-green-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-green-600">{approvedCount}</p>
            <p className="text-xs text-gray-500 font-medium">Đã duyệt</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl text-red-600">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-red-600">{rejectedCount}</p>
            <p className="text-xs text-gray-500 font-medium">Từ chối</p>
          </div>
        </div>
      </div>

      {/* FILTER BAR — Style giống ArticlesPage */}
      <div className="bg-white rounded-2xl p-6 border border-pink-100/30 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* TABS — Style ArticlesPage */}
          <div className="flex bg-[#FFF0F5] p-1 rounded-2xl gap-1 self-start">
            {[
              { key: "all",      label: "Tất cả",   count: poiList.length },
              { key: "pending",  label: "Đang chờ",  count: pendingCount  },
              { key: "approved", label: "Đã duyệt",  count: approvedCount },
              { key: "rejected", label: "Từ chối",   count: rejectedCount },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.key
                    ? "bg-white text-pink-600 shadow-sm"
                    : "text-[#8E707E] hover:text-pink-600"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* DATE FILTER */}
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarDays size={16} className="text-gray-400 flex-shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1) }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-pink-300 bg-gray-50"
              title="Từ ngày"
            />
            <span className="text-gray-400 text-xs">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1) }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-pink-300 bg-gray-50"
              title="Đến ngày"
            />
            {hasDateFilter && (
              <button
                onClick={clearDateFilter}
                className="p-1.5 rounded-full text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition"
                title="Xóa bộ lọc ngày"
              >
                <X size={14} />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* POI LIST */}
      <div className="bg-white rounded-2xl border border-pink-100/30 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-pink-500 bg-white animate-fadeIn">
            <Loader2 className="animate-spin mb-3" size={32} />
            <p className="text-sm font-semibold text-gray-700">Đang tải danh sách địa điểm...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white animate-fadeIn">
            <MapPin size={48} className="text-pink-200 mb-3" />
            <h3 className="text-base font-bold text-gray-700">Không tìm thấy địa điểm nào</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {currentItems.map((poi) => (
              <div
                key={poi.id}
                className={`p-6 ${hoverBg} transition ${poi.status !== "pending" ? "opacity-80" : ""}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* POI NAME + STATUS BADGE */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-800 truncate">
                        {poi.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getStatusBadgeStyle(poi.status)}`}>
                        {getStatusLabel(poi.status)}
                      </span>
                    </div>

                    {/* BASIC INFO */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <ChartBarStacked size={16} /> {poi.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar1 size={16} />
                        {new Date(poi.requestedAt || poi.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                      {poi.requester && (
                        <span className="flex items-center gap-1">
                          <User size={16} /> {poi.requester}
                        </span>
                      )}
                    </div>

                    {/* EXTRA INFO */}
                    {renderExtraInfo && renderExtraInfo(poi)}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    {poi.status === "pending" ? (
                      renderActions && renderActions(poi)
                    ) : (
                      renderReviewAction ? (
                        renderReviewAction(poi)
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400 italic">
                          <CheckCircle2 size={14} />
                          Đã xử lý
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 text-sm text-gray-500 bg-gray-50/50 border-t">
                <p>
                  Hiển thị trang <span className="font-bold text-gray-800">{currentPage}</span>{" "}
                  / <span className="font-bold">{totalPages}</span>
                  <span className="ml-2 text-gray-400">({filteredList.length} đơn)</span>
                </p>

                <div className="flex gap-1 items-center">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => goToPage(currentPage - 1)}
                    className={`p-2 rounded-full ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-pink-500 hover:bg-pink-50 transition"}`}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(i => i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1))
                    .reduce((acc, curr, idx, arr) => {
                      if (idx > 0 && curr - arr[idx - 1] > 1) acc.push("...")
                      acc.push(curr)
                      return acc
                    }, [])
                    .map((p, idx) =>
                      p === "..." ? (
                        <span key={`dots-${idx}`} className="px-2 text-gray-400">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => goToPage(p)}
                          className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                            currentPage === p
                              ? "bg-pink-500 text-white shadow-sm"
                              : "hover:bg-pink-50 hover:text-pink-600"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                    className={`p-2 rounded-full ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-pink-500 hover:bg-pink-50 transition"}`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* WARNING NOTE */}
      {warningNote && (
        <div className="mt-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">{warningNote}</p>
        </div>
      )}
    </div>
  )
}
