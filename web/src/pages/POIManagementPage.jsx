import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle, AlertCircle, Trash2 } from "lucide-react"

export default function POIManagementPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    newCount: 0,
    updateCount: 0,
    deleteCount: 0,
  })

  useEffect(() => {
    // TODO: Fetch thống kê từ API
    // const fetchStats = async () => {
    //   try {
    //     const res = await getPoiStatsApi()
    //     setStats(res)
    //   } catch (err) {
    //     console.error("Load POI stats error:", err)
    //   }
    // }
    // fetchStats()

    // Mock data cho demo
    setStats({
      newCount: 12,
      updateCount: 8,
      deleteCount: 3,
    })
  }, [])

  const managementCards = [
    {
      id: "new",
      title: "POI Mới Tạo",
      count: stats.newCount,
      countLabel: "NEW",
      description: "Xem và phê duyệt các địa điểm được thêm gần đây và đối với công đồng",
      linkText: "Xem chi tiết →",
      icon: CheckCircle,
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      badgeBg: "bg-blue-200",
      badgeText: "text-blue-700",
      iconColor: "text-blue-600",
      linkColor: "text-blue-600 hover:text-blue-700",
      onClick: () => navigate("/poi/management/new"),
    },
    {
      id: "update",
      title: "POI Cần Cập Nhật",
      count: stats.updateCount,
      countLabel: "UPDATES",
      description: "Xem xét yêu cầu sửa đổi và cải thiện hình ảnh và cải thiện dữ liệu của địa điểm",
      linkText: "Xử lý ngay →",
      icon: AlertCircle,
      bgColor: "bg-gradient-to-br from-amber-50 to-amber-100",
      badgeBg: "bg-amber-200",
      badgeText: "text-amber-700",
      iconColor: "text-amber-600",
      linkColor: "text-amber-600 hover:text-amber-700",
      onClick: () => navigate("/poi/management/updates"),
    },
    {
      id: "delete",
      title: "POI Cần Xóa",
      count: stats.deleteCount,
      countLabel: "DELETIONS",
      description: "Xử lý yêu cầu loại bỏ các điểm tham quan đóng cửa hoặc bị báo cáo vấn đề",
      linkText: "Xem yêu cầu →",
      icon: Trash2,
      bgColor: "bg-gradient-to-br from-red-50 to-red-100",
      badgeBg: "bg-red-200",
      badgeText: "text-red-700",
      iconColor: "text-red-600",
      linkColor: "text-red-600 hover:text-red-700",
      onClick: () => navigate("/poi/management/deletions"),
    },
  ]

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          QUẢN LÝ POI
        </h1>
        <p className="text-gray-600 text-base">
          Duyệt và quản lý vòng đời điểm tham quan
        </p>
      </div>

      {/* MANAGEMENT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {managementCards.map((card) => {
          const IconComponent = card.icon
          return (
            <div
              key={card.id}
              onClick={card.onClick}
              className={`${card.bgColor} rounded-2xl p-8 cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 border-transparent hover:border-pink-300`}
            >
              {/* CARD HEADER WITH ICON AND BADGE */}
              <div className="flex justify-between items-start mb-4">
                <div className={`${card.iconColor} p-3 bg-white rounded-full`}>
                  <IconComponent size={24} />
                </div>
                <span className={`${card.badgeBg} ${card.badgeText} px-3 py-1 rounded-full text-xs font-bold`}>
                  {card.count} {card.countLabel}
                </span>
              </div>

              {/* CARD TITLE */}
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {card.title}
              </h2>

              {/* CARD DESCRIPTION */}
              <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                {card.description}
              </p>

              {/* CARD LINK */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  card.onClick()
                }}
                className={`${card.linkColor} font-semibold text-sm transition-all inline-flex items-center gap-2`}
              >
                {card.linkText}
              </button>
            </div>
          )
        })}
      </div>

      {/* QUICK STATS SUMMARY */}
      <div className="mt-12 bg-white rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Tóm tắt
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {stats.newCount}
            </p>
            <p className="text-sm text-gray-600">
              POI mới chờ phê duyệt
            </p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <p className="text-3xl font-bold text-amber-600 mb-2">
              {stats.updateCount}
            </p>
            <p className="text-sm text-gray-600">
              POI chờ cập nhật
            </p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <p className="text-3xl font-bold text-red-600 mb-2">
              {stats.deleteCount}
            </p>
            <p className="text-sm text-gray-600">
              POI chờ xóa
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
