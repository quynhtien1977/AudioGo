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

  // ⚡ Real-time count from in-memory SignalR presence
  const [onlineNow, setOnlineNow] = useState(0)
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
    // ✅ Helper: lấy snapshot onlineNow từ hub (dùng cả khi connect + reconnect)
    const fetchSnapshot = async () => {
      try {
        const snapshot = await signalRService.connection?.invoke("GetActiveDevices")
        if (snapshot?.onlineNow !== undefined) {
          setOnlineNow(snapshot.onlineNow)
        }
      } catch (err) {
        console.warn("⚠️ GetActiveDevices failed:", err.message)
      }
    }

    // ✅ CONNECT SIGNALR
    const initSignalR = async () => {
      try {
        await signalRService.connect()
        setSignalRStatus("connected")

        // ⚡ Lấy snapshot ngay khi kết nối thành công lần đầu
        await fetchSnapshot()

        // 🟢 SUBSCRIBE: DEVICE ONLINE
        const unsubscribeOnline = signalRService.subscribe(
          "onDeviceOnline",
          (device) => {
            if (!device?.deviceId || device.deviceId.trim() === "") return

            console.log("📱 Device Online:", device)

            // ⚡ Cập nhật count từ server
            if (device.onlineNow !== undefined) setOnlineNow(device.onlineNow)

            setData((prevData) => {
              const existingIndex = prevData.findIndex((d) => d.deviceId === device.deviceId)
              if (existingIndex > -1) {
                const updated = [...prevData]
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  timestamp: new Date().toISOString(),
                  isActive: true,
                }
                return updated
              } else {
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
            if (!device?.deviceId || device.deviceId.trim() === "") return

            console.log("📴 Device Offline:", device)

            // ⚡ Cập nhật count từ server
            if (device.onlineNow !== undefined) setOnlineNow(device.onlineNow)

            // ✅ Chỉ set isActive=false — KHÔNG thay timestamp
            // Timestamp = thời điểm gửi location lần cuối, không phải lúc disconnect
            setData((prevData) =>
              prevData.map((d) =>
                d.deviceId === device.deviceId
                  ? { ...d, isActive: false }
                  : d
              )
            )
          }
        )

        // 📍 SUBSCRIBE: LOCATION UPDATE
        const unsubscribeLocationUpdate = signalRService.subscribe(
          "onLocationUpdated",
          (location) => {
            if (!location?.deviceId || location.deviceId.trim() === "") {
              console.log("⏭️ Ignored LocationUpdated: Empty deviceId")
              return
            }

            console.log("📍 Location Update Event:", location)
            
            setData((prevData) =>
              prevData.map((d) =>
                d.deviceId === location.deviceId
                  ? {
                      ...d,
                      latitude: location.latitude,
                      longitude: location.longitude,
                      timestamp: location.timestamp || new Date().toISOString(),
                    }
                  : d
              )
            )
          }
        )

        // ✅ SUBSCRIBE: CONNECTION STATUS
        // — Khi reconnect thành công, re-fetch snapshot để cập nhật onlineNow
        const unsubscribeStatus = signalRService.subscribe(
          "onConnectionStatusChanged",
          async (status) => {
            console.log(`📡 SignalR Status: ${status}`)
            setSignalRStatus(status)

            // ⚡ Sau khi reconnect → lấy lại onlineNow (trạng thái có thể thay đổi khi mất kết nối)
            if (status === "connected") {
              await fetchSnapshot()
            }
          }
        )

        // ✅ STORE UNSUBSCRIBER FUNCTIONS SAFELY
        unsubscribeRef.current = {
          online: unsubscribeOnline || (() => {}),
          offline: unsubscribeOffline || (() => {}),
          locationUpdate: unsubscribeLocationUpdate || (() => {}),
          status: unsubscribeStatus || (() => {}),
        }

      } catch (err) {
        console.error("❌ SignalR Init Error:", err)
        setSignalRStatus("disconnected")
        // ✅ ENSURE CLEANUP ON ERROR
        unsubscribeRef.current = {
          online: () => {},
          offline: () => {},
          locationUpdate: () => {},
          status: () => {},
        }
      }
    }

    initSignalR()

    // ✅ CLEANUP: DISCONNECT ON UNMOUNT
    return () => {
      try {
        if (unsubscribeRef.current?.online) unsubscribeRef.current.online()
        if (unsubscribeRef.current?.offline) unsubscribeRef.current.offline()
        if (unsubscribeRef.current?.locationUpdate) unsubscribeRef.current.locationUpdate()
        if (unsubscribeRef.current?.status) unsubscribeRef.current.status()
      } catch (err) {
        console.error("❌ Error unsubscribing from listeners:", err)
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
          
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1rem"
      }}>
        {/* ⚡ ONLINE NOW — real-time in-memory */}
        <Card
          title="Online ngay bây giờ"
          value={onlineNow}
          sub={signalRStatus === "connected" ? "🟢 Kết nối SignalR" : "🔴 Mất kết nối"}
          color="text-emerald-600"
          icon={signalRStatus === "connected" ? <Wifi size={20} /> : <WifiOff size={20} />}
        />

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