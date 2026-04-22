import { useState, useEffect, useRef } from "react"
import { getLocationLogs, getLocationStats } from "../api/locationLogApi"
import DeviceTrackingTable from "../components/DeviceTrackingTable"
import Card from "../components/Card"
import { Activity, Calendar, BarChart3, Wifi, WifiOff } from "lucide-react"
import { signalRService } from "../lib/signalRService"

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

  const [signalRStatus, setSignalRStatus] = useState("disconnected")
  const unsubscribeRef = useRef({})

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
  // 🔥 SIGNALR CONNECTION & REALTIME MONITORING
  // =========================
  useEffect(() => {
    // ✅ CONNECT SIGNALR
    const initSignalR = async () => {
      try {
        await signalRService.connect()
        setSignalRStatus("connected")

        // 🟢 SUBSCRIBE: DEVICE ONLINE
        const unsubscribeOnline = signalRService.subscribe(
          "onDeviceOnline",
          (device) => {
            // ❌ IGNORE IF NO VALID DEVICE ID (from web connections)
            if (!device?.deviceId || device.deviceId.trim() === "") {
              console.log("⏭️ Ignored DeviceOnline: Empty deviceId")
              return
            }

            console.log("📱 Device Online Event:", device)
            
            // UPDATE TABLE - Device xuất hiện online realtime
            setData((prevData) => {
              // Kiểm tra device đã có trong list chưa
              const existingIndex = prevData.findIndex((d) => d.deviceId === device.deviceId)
              
              if (existingIndex > -1) {
                // Cập nhật device hiện có
                const updated = [...prevData]
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  timestamp: new Date().toISOString(),
                  isActive: true,
                }
                return updated
              } else {
                // Thêm device mới vào đầu danh sách
                return [
                  {
                    deviceId: device.deviceId,
                    latitude: device.latitude || 0,
                    longitude: device.longitude || 0,
                    timestamp: new Date().toISOString(),
                    isActive: true,
                  },
                  ...prevData,
                ]
              }
            })
          }
        )

        // 🔴 SUBSCRIBE: DEVICE OFFLINE
        const unsubscribeOffline = signalRService.subscribe(
          "onDeviceOffline",
          (device) => {
            // ❌ IGNORE IF NO VALID DEVICE ID (from web connections)
            if (!device?.deviceId || device.deviceId.trim() === "") {
              console.log("⏭️ Ignored DeviceOffline: Empty deviceId")
              return
            }

            console.log("📱 Device Offline Event:", device)
            
            // UPDATE TABLE - Device chuyển sang offline realtime
            setData((prevData) =>
              prevData.map((d) =>
                d.deviceId === device.deviceId
                  ? {
                      ...d,
                      timestamp: new Date().toISOString(),
                      isActive: false,
                    }
                  : d
              )
            )
          }
        )

        // 📡 SUBSCRIBE: CONNECTION STATUS
        const unsubscribeStatus = signalRService.subscribe(
          "onConnectionStatusChanged",
          (status) => {
            console.log(`📡 SignalR Status: ${status} (waiting for mobile device connections)`)
            setSignalRStatus(status)
          }
        )

        unsubscribeRef.current = {
          online: unsubscribeOnline,
          offline: unsubscribeOffline,
          status: unsubscribeStatus,
        }

      } catch (err) {
        console.error("❌ SignalR Init Error:", err)
        setSignalRStatus("disconnected")
      }
    }

    initSignalR()

    // ✅ CLEANUP: DISCONNECT ON UNMOUNT
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current.online?.()
        unsubscribeRef.current.offline?.()
        unsubscribeRef.current.status?.()
      }
      signalRService.disconnect()
    }
  }, [])

  // =========================
  // 🔥 FETCH STATS
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
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#1f2937",
            margin: 0
          }}>
            QUẢN LÝ THIẾT BỊ
          </h1>
          
          {/* SIGNALR STATUS INDICATOR */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            backgroundColor: signalRStatus === "connected" ? "#dcfce7" : "#fee2e2",
            border: `1px solid ${signalRStatus === "connected" ? "#86efac" : "#fca5a5"}`
          }}>
            {signalRStatus === "connected" ? (
              <>
                <Wifi size={16} style={{ color: "#16a34a" }} />
                <span style={{ fontSize: "0.875rem", color: "#16a34a", fontWeight: "500" }}>
                  Connected
                </span>
              </>
            ) : (
              <>
                <WifiOff size={16} style={{ color: "#dc2626" }} />
                <span style={{ fontSize: "0.875rem", color: "#dc2626", fontWeight: "500" }}>
                  {signalRStatus === "reconnecting" ? "Reconnecting..." : "Disconnected"}
                </span>
              </>
            )}
          </div>
        </div>
        
        <p style={{
          fontSize: "0.875rem",
          color: "#6b7280",
          margin: 0
        }}>
          Hệ thống realtime monitoring device thông qua SignalR
          <br />
          <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontStyle: "italic" }}>
            (Web đang chờ kết nối từ mobile devices)
          </span>
        </p>
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