import { useEffect, useState } from "react"
import { MapPin, Headphones } from "lucide-react"

import StatsCard from "@/components/StatsCard"
import TrendingChart from "@/components/TrendingChart"
import TopPOIModal from "@/components/TopPOIModal"

import { getTopPOIs } from "@/api/analyticsApi"
import { getAllPOIs } from "@/api/poiApi"

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [pois, setPois] = useState([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔥 gọi song song
        const [topPoisRes, allPoisRes] = await Promise.all([
          getTopPOIs(10),
          getAllPOIs()
        ])

        // Validate topPoisRes is an array
        if (!Array.isArray(topPoisRes)) {
          throw new Error("getTopPOIs did not return an array")
        }

        // 🔥 map poiId -> full info
        const poiMap = {}
        allPoisRes.forEach(p => {
          poiMap[p.id] = p
        })

        // 🔥 merge data
        const merged = topPoisRes.map((tp, index) => {
          const poi = poiMap[tp.poiId]

          return {
            rank: index + 1,
            name: tp.title || "Unknown",
            listens: tp.count || 0,
            lat: poi?.latitude ?? "Unknown",
            lng: poi?.longitude ?? "Unknown",
            category: poi?.category ?? "Unknown"
          }
        })

        //  stats
        const totalPOIs = allPoisRes.length

        const totalListens = topPoisRes.reduce(
          (sum, p) => sum + p.count,
          0
        )

        setStats({
          pois: {
            total: totalPOIs,
            percent: "+0%" // chưa có growth thì để tạm
          },
          audio: {
            total: totalListens,
            percent: "+0%"
          }
        })

        setPois(merged)

      } catch (err) {
        console.error("Dashboard error:", err)
      }
    }

    fetchData()
  }, [])

  if (!stats) {
    return <div className="p-6">Loading dashboard...</div>
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

  return (
    <div className="p-6 space-y-6">

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          TỔNG QUAN
        </h1>
        <p className="text-gray-500 mt-2">
          Chào mừng đến với hệ thống quản lý AudioGo!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-6">
        <StatsCard
          title="TỔNG SỐ LƯỢNG POIs"
          value={stats.pois.total}
          percent={stats.pois.percent}
          icon={<MapPin size={20} />}
        />
        <StatsCard
          title="TỔNG SỐ LẦN PHÁT AUDIO"
          value={stats.audio.total}
          percent={stats.audio.percent}
          icon={<Headphones size={20} />}
        />
      </div>

      {/* Chart (tạm để rỗng hoặc mock) */}
      <TrendingChart data={[]} />

      {/* Table */}
      <div className="bg-white rounded-2xl border p-6">

        <div className="flex justify-between mb-4">
          <h2 className="font-semibold">CÁC POIs PHỔ BIẾN</h2>
          <span
            onClick={() => setShowModal(true)}
            className="text-pink-500 cursor-pointer hover:text-pink-400"
          >
            Xem Tất Cả →
          </span>
        </div>

        {showModal && (
          <TopPOIModal onClose={() => setShowModal(false)} />
        )}

        <table className="w-full text-sm">
          <thead className="text-gray-400 text-left">
            <tr>
              <th>TÊN POI</th>
              <th>VỊ TRÍ</th>
              <th>THỂ LOẠI</th>
              <th>LƯỢT NGHE</th>
            </tr>
          </thead>

          <tbody className="text-gray-700">
            {pois.slice(0, 3).map((poi) => (
              <tr key={poi.rank} className="border-t">
                <td className="py-3">{poi.name}</td>

                <td>
                  {poi.lat}, {poi.lng}
                </td>

                <td>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(poi.category)}`}>
                    {poi.category}
                  </span>
                </td>

                <td>{poi.listens} lượt</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}