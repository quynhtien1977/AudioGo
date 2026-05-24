import { useEffect, useState } from "react"
import { MapPin, Headphones, LayoutDashboard } from "lucide-react"

import StatsCard from "@/components/StatsCard"
import TrendingChart from "@/components/TrendingChart"
import TopPOIModal from "@/components/TopPOIModal"
import PageHeader from "@/components/PageHeader"

import { getTopPOIs, getListenStats } from "@/api/analyticsApi"
import { getAllPOIs } from "@/api/poiApi"

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [pois, setPois] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [chartData, setChartData] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)

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
          getListenStats()
        ])

        if (!Array.isArray(topPoisRes)) {
          throw new Error("getTopPOIs did not return an array")
        }

        // Filter POIs based on role
        let filteredPois = allPoisRes
        if (userRole === "Owner") {
          filteredPois = allPoisRes.filter(p => p.accountId === userId)
        }

        // map poiId -> full info
        const poiMap = {}
        filteredPois.forEach(p => {
          poiMap[p.poiId] = p
        })

        // merge top POIs (filtered by role)
        const merged = topPoisRes
          .filter(tp => poiMap[tp.poiId]) // Only include POIs that match filtered list
          .map((tp, index) => {
            const poi = poiMap[tp.poiId]

            return {
              rank: index + 1,
              name: tp.title || "Unknown",
              listens: tp.listenCount || 0,
              lat: poi?.latitude ?? "N/A",
              lng: poi?.longitude ?? "N/A",
              category: tp.category || "Unknown"
            }
          })

        // Calculate stats based on filtered POIs
        const totalListens = merged.reduce((sum, p) => sum + p.listens, 0)

        setStats({
          pois: {
            total: filteredPois.length,
          },
          audio: {
            total: totalListens,
          }
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

  if (!stats) {
    return <div className="p-6">Loading dashboard...</div>
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

  return (
    <div className="space-y-6">

      <PageHeader
        title="TỔNG QUAN"
        description="Chào mừng đến với hệ thống quản lý AudioGo!"
        icon={<LayoutDashboard size={24} />}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-6">
        <StatsCard
          title="TỔNG SỐ LƯỢNG POIs"
          value={stats.pois.total}
          icon={<MapPin size={20} />}
        />
        <StatsCard
          title="TỔNG SỐ LẦN PHÁT AUDIO"
          value={stats.audio.total}
          icon={<Headphones size={20} />}
        />
      </div>

      {/* Chart (tạm để rỗng hoặc mock) */}
      <TrendingChart data={chartData} />

      {/* Table */}
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
          <TopPOIModal 
            onClose={() => setShowModal(false)} 
            pois={pois}   
          />
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
              {pois.slice(0, 3).map((poi) => (
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

                  <td className="px-6 py-4 font-bold text-gray-700">{poi.listens} lượt</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}