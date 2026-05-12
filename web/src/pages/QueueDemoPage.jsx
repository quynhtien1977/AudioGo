import React, { useState } from 'react'
import { Rocket, Activity, CheckCircle2, Clock, XCircle, Zap, ArrowDown, ArrowUp } from 'lucide-react'

const QueueDemoPage = () => {
  const [numDevices, setNumDevices] = useState(200)
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [metrics, setMetrics] = useState(null)
  const [logs, setLogs] = useState([])
  const [errorMsg, setErrorMsg] = useState('')

  const handleSimulate = async () => {
    if (numDevices <= 0 || numDevices > 100000) {
      alert("Vui lòng chọn số lượng thiết bị từ 1 đến 100000.")
      return
    }

    setStatus('loading')
    setMetrics(null)
    setLogs([])
    setErrorMsg('')

    const API_URL = 'http://localhost:5086/api/mobile/location-log'
    const CONCURRENCY = 50  // Số request chạy song song cùng lúc — tránh TCP saturation
    const results = []
    const startTimeTotal = Date.now()

    // Chia thành các "slot" chạy song song tối đa CONCURRENCY tại 1 thời điểm
    // Thay vì fire tất cả 10000 cùng lúc (browser chỉ xử lý 6 TCP connection/host)
    const sendOne = async (i) => {
      const payload = {
        deviceId: `fake-device-${i}`,
        points: [{
          latitude:  10.7769 + (Math.random() * 0.01),
          longitude: 106.7009 + (Math.random() * 0.01),
          timestamp: new Date().toISOString()
        }]
      }
      const reqStart = Date.now()
      try {
        const res = await fetch(API_URL, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload)
        })
        return { id: payload.deviceId, status: res.status, duration: Date.now() - reqStart, success: res.ok }
      } catch (err) {
        return { id: payload.deviceId, status: 'Error', duration: Date.now() - reqStart, success: false }
      }
    }

    // Pool pattern: giữ đúng CONCURRENCY worker chạy liên tục cho đến hết N request
    const queue = Array.from({ length: numDevices }, (_, i) => i)
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length > 0) {
        const i = queue.shift()
        if (i === undefined) break
        const result = await sendOne(i)
        results.push(result)
      }
    })

    try {
      await Promise.all(workers)
      const durationTotal = Date.now() - startTimeTotal

      let successCount = 0, failCount = 0, maxTime = 0, minTime = Number.MAX_VALUE
      results.forEach(r => {
        if (r.success) successCount++; else failCount++
        if (r.duration > maxTime) maxTime = r.duration
        if (r.duration < minTime) minTime = r.duration
      })

      if (results.length === 0) minTime = 0

      setLogs(results)
      setMetrics({
        total:         numDevices,
        success:       successCount,
        failed:        failCount,
        totalDuration: durationTotal,
        avgTime:       (durationTotal / numDevices).toFixed(2),
        maxTime,
        minTime
      })
      setStatus('success')
    } catch (error) {
      console.error(error)
      setErrorMsg(error.message)
      setStatus('error')
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1000px", margin: "0 auto", padding: "2rem 0", width: "100%" }}>
      
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "800", color: "#1f2937", margin: "0 0 1rem 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
          <Rocket className="text-pink-500" size={36} /> 
          Giả lập ghi log vị trí
        </h1>
        <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>
          Giả lập lưu lượng thiết bị gửi log vị trí cùng lúc để kiểm tra khả năng chịu tải của hệ thống.
        </p>
      </div>

      <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "1rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", border: "1px solid #e5e7eb" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div>
            <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
              Số lượng thiết bị gửi GPS cùng lúc:
            </label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <input 
                type="number" 
                value={numDevices}
                onChange={(e) => setNumDevices(parseInt(e.target.value) || 0)}
                min="1"
                max="100000"
                style={{ flex: 1, padding: "0.75rem 1rem", fontSize: "1rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", outline: "none" }}
              />
              <button 
                onClick={handleSimulate}
                disabled={status === 'loading'}
                style={{ 
                  padding: "0.75rem 2rem", 
                  backgroundColor: status === 'loading' ? "#9ca3af" : "#ec4899", 
                  color: "white", 
                  fontWeight: "600", 
                  fontSize: "1rem", 
                  borderRadius: "0.5rem", 
                  border: "none",
                  cursor: status === 'loading' ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "background-color 0.2s"
                }}
              >
                {status === 'loading' ? (
                  <>
                    <Activity className="animate-spin" size={20} /> Đang chạy test...
                  </>
                ) : (
                  <>
                    <Zap size={20} /> Bắt đầu Stress Test
                  </>
                )}
              </button>
            </div>
          </div>

          {/* KẾT QUẢ: CARDS */}
          {status === 'success' && metrics && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                {/* Card 1: Tổng số */}
                <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}>
                  <div style={{ color: "#475569", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.25rem" }}>TỔNG REQUESTS</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#1e293b" }}>{metrics.total}</div>
                </div>
                {/* Card 2: Thành công */}
                <div style={{ backgroundColor: "#ecfdf5", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #a7f3d0" }}>
                  <div style={{ color: "#059669", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <CheckCircle2 size={16} /> THÀNH CÔNG
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#064e3b" }}>{metrics.success}</div>
                </div>
                {/* Card 3: Thất bại */}
                <div style={{ backgroundColor: "#fef2f2", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #fecaca" }}>
                  <div style={{ color: "#dc2626", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <XCircle size={16} /> THẤT BẠI
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#7f1d1d" }}>{metrics.failed}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                {/* Card 4: Tốc độ TB */}
                <div style={{ backgroundColor: "#eff6ff", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #bfdbfe" }}>
                  <div style={{ color: "#2563eb", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Activity size={16} /> THỜI GIAN TRUNG BÌNH
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1e3a8a" }}>
                    {metrics.avgTime} <span style={{ fontSize: "1rem", color: "#2563eb" }}>ms/req</span>
                  </div>
                </div>
                {/* Card 5: Tốc độ Max */}
                <div style={{ backgroundColor: "#eff6ff", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #bfdbfe" }}>
                  <div style={{ color: "#2563eb", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <ArrowDown size={16} /> CHẬM NHẤT (MAX)
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1e3a8a" }}>
                    {metrics.maxTime} <span style={{ fontSize: "1rem", color: "#2563eb" }}>ms</span>
                  </div>
                </div>
                {/* Card 6: Tốc độ Min */}
                <div style={{ backgroundColor: "#eff6ff", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #bfdbfe" }}>
                  <div style={{ color: "#2563eb", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <ArrowUp size={16} /> NHANH NHẤT (MIN)
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1e3a8a" }}>
                    {metrics.minTime} <span style={{ fontSize: "1rem", color: "#2563eb" }}>ms</span>
                  </div>
                </div>
              </div>

              {/* TABLE CHI TIẾT */}
              <div style={{ marginTop: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", overflow: "hidden" }}>
                <div style={{ backgroundColor: "#f9fafb", padding: "1rem", borderBottom: "1px solid #e5e7eb", fontWeight: "600", color: "#374151" }}>
                  Chi tiết từng Request (Giới hạn hiển thị 200 dòng đầu)
                </div>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead style={{ backgroundColor: "#f3f4f6", position: "sticky", top: 0 }}>
                      <tr>
                        <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #e5e7eb", color: "#4b5563", fontSize: "0.9rem" }}>Device ID</th>
                        <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #e5e7eb", color: "#4b5563", fontSize: "0.9rem" }}>HTTP Status</th>
                        <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #e5e7eb", color: "#4b5563", fontSize: "0.9rem" }}>Thời gian phản hồi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(0, 200).map((log, index) => (
                        <tr key={index} style={{ backgroundColor: log.success ? "white" : "#fef2f2", borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "0.75rem 1rem", fontSize: "0.95rem", fontWeight: "500", color: "#1f2937" }}>{log.id}</td>
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <span style={{ 
                              padding: "0.25rem 0.75rem", 
                              borderRadius: "999px", 
                              fontSize: "0.85rem", 
                              fontWeight: "600",
                              backgroundColor: log.success ? "#d1fae5" : "#fee2e2",
                              color: log.success ? "#065f46" : "#991b1b"
                            }}>
                              {log.status}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem 1rem", fontSize: "0.95rem", color: "#374151", fontWeight: "500" }}>
                            {log.duration} ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {status === 'error' && (
            <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #fecaca" }}>
              <strong>Lỗi:</strong> {errorMsg}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default QueueDemoPage
