import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  MapPin, Headphones, LayoutDashboard, Clock,
  Users, ArrowRight, ShieldCheck,
} from "lucide-react"

import StatsCard from "@/components/StatsCard"
import TrendingChart from "@/components/TrendingChart"
import TopPOIModal from "@/components/TopPOIModal"
import PageHeader from "@/components/PageHeader"
import PageLoader from "@/components/PageLoader"

import { getTopPOIs, getListenStats } from "@/api/analyticsApi"
import { getAllPOIs } from "@/api/poiApi"
import { getPoiRequestStats } from "@/api/poiRequestApi"
import { getUsersApi } from "@/api/accountApi"

export default function DashboardPage() {
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [pois, setPois] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [chartData, setChartData] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)

  // Admin-only extras
  const [pendingCount, setPendingCount] = useState(0)
  const [newAccountsCount, setNewAccountsCount] = useState(0)

  // Get current user info
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user") || sessionStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        setUserRole(user.role)
        setUserId(user.accountId)
      }
    } catch (err) {
      console.error("Error reading user info:", err)
    }
  }, [])

  useEffect(() => {
    if (!userRole || !userId) return

    const fetchData = async () => {
      try {
        const [topPoisRes, allPoisRes, statsRes] = await Promise.all([
          getTopPOIs(10),
          getAllPOIs(),
          getListenStats(),
        ])

        if (!Array.isArray(topPoisRes)) {
          throw new Error("getTopPOIs did not return an array")
        }

        let filteredPois = allPoisRes
        if (userRole === "Owner") {
          filteredPois = allPoisRes.filter(p => p.accountId === userId)
        }

        const poiMap = {}
        filteredPois.forEach(p => { poiMap[p.poiId] = p })

        const merged = topPoisRes
          .filter(tp => poiMap[tp.poiId])
          .map((tp, index) => {
            const poi = poiMap[tp.poiId]
            return {
              rank: index + 1,
              name: tp.title || "Unknown",
              listens: tp.listenCount || 0,
              lat: poi?.latitude ?? "N/A",
              lng: poi?.longitude ?? "N/A",
              category: tp.category || "Unknown",
            }
          })

        const totalListens = merged.reduce((sum, p) => sum + p.listens, 0)

        setStats({
          pois: { total: filteredPois.length },
          audio: { total: totalListens },
        })

        const ownerHasNoPoi = userRole === "Owner" && filteredPois.length === 0
        setChartData(ownerHasNoPoi ? [] : (statsRes.dailyListens || []))
        setPois(merged)

      } catch (err) {
        console.error("Dashboard error:", err)
      }
    }

    fetchData()
  }, [userRole, userId])

  // Fetch Admin-only extras
  useEffect(() => {
    if (userRole !== "Admin") return

    const fetchAdminExtras = async () => {
      try {
        const [requestStats, allUsers] = await Promise.all([
          getPoiRequestStats(),
          getUsersApi(),
        ])

        setPendingCount(requestStats?.totalPending ?? 0)

        // Đếm tài khoản tạo trong 7 ngày gần nhất
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const newAccounts = (allUsers || []).filter(u => {
          const created = new Date(u.createdAt)
          return created >= sevenDaysAgo
        })
        setNewAccountsCount(newAccounts.length)
      } catch (err) {
        console.error("Admin extras fetch error:", err)
      }
    }

    fetchAdminExtras()
  }, [userRole])

  if (!stats) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="TỔNG QUAN"
          description="Chào mững đến với hệ thống quản lý AudioGo!"
          icon={<LayoutDashboard size={24} />}
        />
        <PageLoader text="Đang tải tổng quan..." />
      </div>
    )
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case "Di tích lịch sử": return "bg-blue-100 text-blue-500"
      case "Ẩm thực":         return "bg-pink-100 text-pink-500"
      case "Hải sản & Ốc":   return "bg-cyan-100 text-cyan-500"
      case "Cà phê & Giải khát": return "bg-orange-100 text-orange-500"
      case "Chùa & Tôn giáo": return "bg-purple-100 text-purple-500"
      case "Giải trí":        return "bg-green-100 text-green-500"
      case "Mua sắm":         return "bg-yellow-100 text-yellow-600"
      default:                return "bg-gray-100 text-gray-500"
    }
  }

  return (
    <div className="space-y-6">

      <PageHeader
        title="TỔNG QUAN"
        description="Chào mừng đến với hệ thống quản lý AudioGo!"
        icon={<LayoutDashboard size={24} />}
      />

      {/* STATS CARDS */}
      <div className={`grid gap-6 ${userRole === "Admin" ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2"}`}>
        <StatsCard
          title="TỔNG SỐ POIs"
          value={stats.pois.total}
          sub="Hiện có trong hệ thống"
          icon={<MapPin size={20} />}
        />
        <StatsCard
          title="TỔNG SỐ LẦN PHÁT AUDIO"
          value={stats.audio.total}
          sub="Lượt nghe tích lũy"
          icon={<Headphones size={20} />}
        />

        {/* Chỉ Admin mới thấy */}
        {userRole === "Admin" && (
          <>
            <StatsCard
              title="ĐƠN CHỜ XỬ LÝ"
              value={pendingCount}
              sub="Cần duyệt ngay"
              color={pendingCount > 0 ? "text-amber-500" : "text-gray-400"}
              icon={<Clock size={20} />}
            />
            <StatsCard
              title="TÀI KHOẢN MỚI"
              value={newAccountsCount}
              sub="Trong 7 ngày gần nhất"
              color="text-emerald-600"
              icon={<Users size={20} />}
            />
          </>
        )}
      </div>

      {/* ADMIN QUICK ACTIONS */}
      {userRole === "Admin" && (
        <div className="bg-white rounded-2xl border border-pink-100/30 shadow-sm p-5">
          <p className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-4">Truy cập nhanh</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Quản lý POI",   path: "/pois",            icon: <MapPin size={16} /> },
              { label: "Xét duyệt đơn", path: "/poi/management",  icon: <ShieldCheck size={16} /> },
              { label: "Tài khoản",     path: "/accounts",        icon: <Users size={16} /> },
            ].map(({ label, path, icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#FFF0F5] text-[#8E707E] hover:bg-pink-100 hover:text-pink-600 rounded-xl text-xs font-bold transition-all group"
              >
                {icon}
                {label}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <TrendingChart data={chartData} />

      {/* Top POIs Table */}
      <div className="bg-white rounded-2xl border border-pink-100/30 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-pink-100/20 flex justify-between items-center bg-white">
          <h2 className="font-bold text-base text-pink-500 uppercase tracking-wider">CÁC POIs PHỔ BIẾN</h2>
          <span
            onClick={() => setShowModal(true)}
            className="text-xs font-bold text-pink-500 cursor-pointer hover:text-pink-600 transition-colors uppercase tracking-widest"
          >
            Xem Tất Cả →
          </span>
        </div>

        {showModal && (
          <TopPOIModal onClose={() => setShowModal(false)} pois={pois} />
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-pink-50/20 text-[11px] font-bold text-pink-500 tracking-wider uppercase border-b border-pink-100/20 text-left">
              <tr>
                <th className="px-6 py-4">XẾP HẠNG</th>
                <th className="px-6 py-4">TÊN POI</th>
                <th className="px-6 py-4">VỊ TRÍ</th>
                <th className="px-6 py-4">THỂ LOẠI</th>
                <th className="px-6 py-4">LƯỢT NGHE</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-pink-50/50">
              {pois.slice(0, 5).map((poi) => {
                const maxListens = pois[0]?.listens || 1
                const pct = Math.round((poi.listens / maxListens) * 100)

                return (
                  <tr key={poi.rank} className="hover:bg-pink-50/10 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-700">
                      {String(poi.rank).padStart(2, "0")}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{poi.name}</td>

                    <td className="px-6 py-4 text-gray-400 font-medium">
                      {poi.lat}, {poi.lng}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getCategoryColor(poi.category)}`}>
                        {poi.category}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-700 w-12 text-right">{poi.listens}</span>
                        <div className="flex-1 bg-pink-50 rounded-full h-1.5 min-w-[60px]">
                          <div
                            className="bg-gradient-to-r from-pink-400 to-rose-400 h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}