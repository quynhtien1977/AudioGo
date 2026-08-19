import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CheckCircle,
  AlertCircle,
  Trash2,
  BadgeCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react"

import { getPoiRequestStats } from "@/api/poiRequestApi"
import PageHeader from "@/components/PageHeader"
import StatsCard from "@/components/StatsCard"

export default function POIManagementPage() {
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    newCount: 0,
    updateCount: 0,
    deleteCount: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalPending: 0,
  })

  // ================= FETCH STATS =================
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getPoiRequestStats()
        setStats({
          newCount:       res.newCount       || 0,
          updateCount:    res.updateCount    || 0,
          deleteCount:    res.deleteCount    || 0,
          totalApproved:  res.totalApproved  || 0,
          totalRejected:  res.totalRejected  || 0,
          totalPending:   (res.newCount || 0) + (res.updateCount || 0) + (res.deleteCount || 0),
        })
      } catch (err) {
        console.error("FETCH STATS ERROR:", err)
      }
    }

    fetchStats()
  }, [])

  const managementCards = [
    {
      id: "new",
      title: "POI Mới Tạo",
      count: stats.newCount,
      countLabel: "chờ duyệt",
      description: "Xem và phê duyệt các địa điểm được thêm gần đây từ cộng đồng",
      linkText: "Xem chi tiết →",
      icon: CheckCircle,
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      badgeBg: stats.newCount > 0 ? "bg-blue-500" : "bg-blue-200",
      badgeText: stats.newCount > 0 ? "text-white" : "text-blue-700",
      iconColor: "text-blue-600",
      linkColor: "text-blue-600 hover:text-blue-700",
      onClick: () => navigate("/admin/pois/management/new"),
    },
    {
      id: "update",
      title: "POI Cần Cập Nhật",
      count: stats.updateCount,
      countLabel: "chờ xử lý",
      description: "Xem xét yêu cầu sửa đổi và cải thiện dữ liệu của địa điểm",
      linkText: "Xử lý ngay →",
      icon: AlertCircle,
      bgColor: "bg-gradient-to-br from-amber-50 to-amber-100",
      badgeBg: stats.updateCount > 0 ? "bg-amber-500" : "bg-amber-200",
      badgeText: stats.updateCount > 0 ? "text-white" : "text-amber-700",
      iconColor: "text-amber-600",
      linkColor: "text-amber-600 hover:text-amber-700",
      onClick: () => navigate("/admin/pois/management/updates"),
    },
    {
      id: "delete",
      title: "POI Cần Xóa",
      count: stats.deleteCount,
      countLabel: "chờ xử lý",
      description: "Xử lý yêu cầu loại bỏ các điểm tham quan đóng cửa hoặc bị báo cáo",
      linkText: "Xem yêu cầu →",
      icon: Trash2,
      bgColor: "bg-gradient-to-br from-red-50 to-red-100",
      badgeBg: stats.deleteCount > 0 ? "bg-red-500" : "bg-red-200",
      badgeText: stats.deleteCount > 0 ? "text-white" : "text-red-700",
      iconColor: "text-red-600",
      linkColor: "text-red-600 hover:text-red-700",
      onClick: () => navigate("/admin/pois/management/deletions"),
    },
  ]

  const totalPending = stats.newCount + stats.updateCount + stats.deleteCount

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="QUẢN LÝ XÉT DUYỆT POIs"
        description="Duyệt và quản lý vòng đời, yêu cầu chỉnh sửa/xóa điểm tham quan từ cộng đồng."
        icon={<BadgeCheck size={24} />}
      />

      {/* OVERVIEW STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="TỔNG ĐANG CHỜ"
          value={totalPending}
          sub="Cần xử lý ngay"
          color={totalPending > 0 ? "text-yellow-600" : "text-gray-400"}
          icon={<Clock size={20} />}
        />
        <StatsCard
          title="ĐÃ PHÊ DUYỆT"
          value={stats.totalApproved}
          sub="Tổng đơn được duyệt"
          color="text-green-600"
          icon={<CheckCircle2 size={20} />}
        />
        <StatsCard
          title="ĐÃ TỪ CHỐI"
          value={stats.totalRejected}
          sub="Tổng đơn bị từ chối"
          color="text-red-600"
          icon={<XCircle size={20} />}
        />
        <StatsCard
          title="TỔNG ĐƠN"
          value={totalPending + stats.totalApproved + stats.totalRejected}
          sub="Tất cả yêu cầu POI"
          color="text-pink-600"
          icon={<Activity size={20} />}
        />
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
              <div className="flex justify-between items-start mb-4">
                <div className={`${card.iconColor} p-3 bg-white rounded-full`}>
                  <IconComponent size={24} />
                </div>
                <span className={`${card.badgeBg} ${card.badgeText} px-3 py-1 rounded-full text-xs font-bold transition-colors`}>
                  {card.count} {card.countLabel}
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-2">{card.title}</h2>

              <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                {card.description}
              </p>

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
    </div>
  )
}