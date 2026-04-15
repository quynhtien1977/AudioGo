import { ArrowLeft, ChartBarStacked, Calendar1, User } from "lucide-react"
import { useNavigate } from "react-router-dom"

// Helper function để sort POI list theo status
const sortPoiByStatus = (poiList) => {
  return [...poiList].sort((a, b) => {
    const statusOrder = { pending: 0, approved: 1, rejected: 2 }
    return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0)
  })
}

// Helper function để lấy badge style theo status
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

// Helper function để lấy label status
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
  renderExtraInfo, // Function: (poi) => JSX - để render thông tin bổ sung
  renderActions, // Function: (poi) => JSX - để render nút hành động (chỉ cho pending)
  emptyMessage = "Không có dữ liệu",
  warningNote, // Optional warning message
  statsLabel = "chờ xử lý", // "chờ phê duyệt" | "chờ xử lý"
}) {
  const navigate = useNavigate()
  
  // Sort POI list theo status
  const sortedPoiList = sortPoiByStatus(poiList)
  
  // Count pending items
  const pendingCount = sortedPoiList.filter(poi => poi.status === "pending").length

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(backPath)}
          className={`p-2 rounded-full transition ${
            type === "new"
              ? "hover:bg-blue-100"
              : type === "update"
              ? "hover:bg-amber-100"
              : "hover:bg-red-100"
          }`}
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {title}
          </h1>
          <p className="text-gray-500 text-sm">
            {description}
          </p>
        </div>
      </div>

      {/* STATS BADGE */}
      <div className={`mb-6 inline-block ${badgeColor} ${badgeTextColor} px-4 py-2 rounded-full font-semibold`}>
        {pendingCount} {statsLabel}
      </div>

      {/* POI LIST */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-md">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Đang tải...
          </div>
        ) : sortedPoiList.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="divide-y">
            {sortedPoiList.map((poi) => (
              <div
                key={poi.id}
                className={`p-6 ${hoverBg} transition ${
                  poi.status !== "pending" ? "opacity-75" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* POI NAME + STATUS BADGE */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">
                        {poi.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(poi.status)}`}>
                        {getStatusLabel(poi.status)}
                      </span>
                    </div>

                    {/* BASIC INFO */}
                    <div className="flex gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <ChartBarStacked size={16} /> {poi.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar1 size={16} /> {new Date(poi.requestedAt || poi.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                      {poi.requester && (
                        <span className="flex items-center gap-1">
                          <User size={16} /> {poi.requester}
                        </span>
                      )}
                    </div>

                    {/* EXTRA INFO (passed as children) */}
                    {renderExtraInfo && renderExtraInfo(poi)}
                  </div>

                  {/* ACTION BUTTONS - Only show for pending status */}
                  {poi.status === "pending" && (
                    <div className="flex gap-2">
                      {renderActions && renderActions(poi)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WARNING NOTE */}
      {warningNote && (
        <div className="mt-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            {warningNote}
          </p>
        </div>
      )}
    </div>
  )
}
