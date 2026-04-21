import { useState, useEffect } from "react"
import { getLocationLogs, getLocationStats } from "../api/locationLogApi"
import DeviceTrackingTable from "../components/DeviceTrackingTable"
import Card from "../components/Card"
import { Activity, Calendar, BarChart3 } from "lucide-react"

export default function DeviceTrackingPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  const [data, setData] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)

  const [stats, setStats] = useState({
    today: 0,
    month: 0,
    year: 0
  })

  // =========================
  // FETCH TABLE DATA
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const res = await getLocationLogs(currentPage, pageSize)

        setData(res.data || [])
        setTotalItems(res.totalCount || 0)

      } catch (err) {
        console.error("Load location logs failed:", err)
        setData([])
        setTotalItems(0)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentPage, pageSize])

  // =========================
  // 🔥 FETCH STATS (FIXED)
  // =========================
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getLocationStats()

        // ✅ FIX ĐÚNG KEY BACKEND
        setStats({
          today: res.today || 0,
          month: res.month || 0,
          year: res.year || 0
        })

      } catch (err) {
        console.error("Load stats failed:", err)
        setStats({
          today: 0,
          month: 0,
          year: 0
        })
      }
    }

    fetchStats()
  }, [])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* HEADER */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        marginBottom: "0.5rem"
      }}>
        <h1 style={{
          fontSize: "2rem",
          fontWeight: "700",
          color: "#1f2937",
          margin: 0
        }}>
          QUẢN LÝ THIẾT BỊ
        </h1>
      </div>

      {/* DASHBOARD CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1rem"
      }}>
        <Card
          title="Online hôm nay"
          value={stats.today}
          sub="Thiết bị hoạt động hôm nay"
          color="text-green-600"
          icon={<Activity size={20} />}
        />

        <Card
          title="Trong tháng"
          value={stats.month}
          sub="Thiết bị hoạt động tháng này"
          color="text-yellow-600"
          icon={<Calendar size={20} />}
        />

        <Card
          title="Trong năm"
          value={stats.year}
          sub="Thiết bị hoạt động năm nay"
          color="text-blue-600"
          icon={<BarChart3 size={20} />}
        />
      </div>

      {/* TABLE */}
      <DeviceTrackingTable
        data={data}
        isLoading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  )
} 