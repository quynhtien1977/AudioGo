import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DeviceTrackingTable({
  data = [],
  isLoading = false,
  onPageChange = () => {},
  currentPage = 1,
  pageSize = 10,
  totalItems = 0,
}) {
  const totalPages = Math.ceil(totalItems / pageSize);

  // ✅ Parse UTC timestamp đúng cách
  // DB lưu DateTime.UtcNow dạng "2026-04-23T08:00:00" (không có Z)
  // → browser sẽ hiểu là local time nếu không có Z → lệch múi giờ
  // → thêm Z để force parse as UTC
  const parseUTC = (timestamp) => {
    if (!timestamp) return new Date(0)
    const s = String(timestamp)
    // Nếu chưa có Z hoặc +offset thì thêm Z
    return new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z")
  }

  // ✅ FORMAT DATE
  const formatTimestamp = (timestamp) => {
    const date = parseUTC(timestamp)
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  // ✅ RELATIVE TIME (so sánh UTC với UTC)
  const getRelativeTime = (timestamp) => {
    const now = new Date()
    const date = parseUTC(timestamp)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "vừa xong"
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return formatTimestamp(timestamp)
  }

  // ✅ ONLINE = hoạt động trong 5 phút gần nhất (UTC-aware)
  const isOnline = (timestamp) => {
    const now = new Date()
    const date = parseUTC(timestamp)
    const diffMs = now - date
    const diffMinutes = diffMs / 60000
    return diffMinutes <= 5
  }

  // ✅ Priority: isActive (SignalR real-time) > isOnline (REST API) > timestamp check
  // isActive được set khi nhận DeviceOnline/DeviceOffline event từ SignalR
  // isOnline được tính từ server khi load REST API lần đầu
  const getOnlineStatus = (item) => {
    if (item.isActive !== undefined) return item.isActive  // ← SignalR real-time (ưu tiên)
    if (item.isOnline !== undefined) return item.isOnline  // ← REST API initial load
    return isOnline(item.timestamp)                         // ← fallback timestamp
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      
      {/* Table Container */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "0.5rem",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
      }}>
        {isLoading ? (
          <div style={{
            padding: "2rem",
            textAlign: "center",
            color: "#6b7280"
          }}>
            <div style={{
              animation: "spin 1s linear infinite",
              display: "inline-block",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              borderTop: "3px solid #ec4899",
              borderRight: "3px solid transparent"
            }}></div>
            <p style={{ marginTop: "0.5rem" }}>Đang tải dữ liệu...</p>
          </div>
        ) : data && data.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem"
            }}>
              <thead>
                <tr style={{ backgroundColor: "#fce7f3", borderBottom: "1px solid #fbcfe8" }}>
                  <th style={thStyle}>ID THIẾT BỊ</th>
                  <th style={thStyle}>VỊ TRÍ THIẾT BỊ</th>
                  <th style={thStyle}>THỜI GIAN</th>
                  <th style={thStyle}>TRẠNG THÁI</th>
                </tr>
              </thead>

              <tbody>
                {data.map((item, index) => (
                  <tr
                    key={item.locationId}
                    style={{
                      borderBottom: "1px solid #f3e8f4",
                      backgroundColor: index % 2 === 0 ? "#fdf8fc" : "#ffffff",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fae8f5"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#fdf8fc" : "#ffffff"}
                  >
                    <td style={tdIdStyle}>
                      {item.deviceId}
                    </td>

                    <td style={tdStyle}>
                      {item.latitude?.toFixed(4)} / {item.longitude?.toFixed(4)}
                    </td>

                    <td style={tdStyle}>
                      <div style={{ fontWeight: "500" }}>
                        {getRelativeTime(item.timestamp)}
                      </div>
                    </td>

                    {/* ✅ STATUS — ưu tiên isActive (SignalR) > isOnline (REST) > timestamp */}
                    <td style={tdStatusStyle}>
                      {getOnlineStatus(item) ? (
                        <span style={{ color: "#16a34a" }}>🟢 Online</span>
                      ) : (
                        <span style={{ color: "#dc2626" }}>🔴 Offline</span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            padding: "2rem",
            textAlign: "center",
            color: "#6b7280"
          }}>
            <p style={{ fontSize: "0.875rem" }}>Không tìm thấy dữ liệu</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem",
        backgroundColor: "#ffffff",
        borderRadius: "0.5rem",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{
          fontSize: "0.875rem",
          color: "#6b7280"
        }}>
          Hiển thị {data?.length || 0} / {totalItems} vị trí
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={btnStyle(currentPage === 1)}
          >
            <ChevronLeft size={18} />
          </button>

          <div style={{ display: "flex", gap: "0.25rem" }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  style={pageBtnStyle(currentPage === pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={btnStyle(currentPage === totalPages)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ================= STYLES ================= */

const thStyle = {
  padding: "1rem 1.5rem",
  textAlign: "left",
  fontWeight: "600",
  color: "#ec4899",
  fontSize: "0.75rem",
  letterSpacing: "0.05em",
  textTransform: "uppercase"
};

const tdStyle = {
  padding: "1rem 1.5rem",
  color: "#374151",
  fontSize: "0.875rem"
};

const tdIdStyle = {
  ...tdStyle,
  color: "#ec4899",
  fontWeight: "600",
  cursor: "pointer"
};

const tdStatusStyle = {
  padding: "1rem 1.5rem",
  fontSize: "0.875rem",
  fontWeight: "600"
};

const btnStyle = (disabled) => ({
  padding: "0.5rem",
  borderRadius: "0.5rem",
  backgroundColor: "#ffffff",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1
});

const pageBtnStyle = (active) => ({
  width: "32px",
  height: "32px",
  borderRadius: "0.5rem",
  border: "none",
  fontWeight: "600",
  cursor: "pointer",
  backgroundColor: active ? "#ec4899" : "#fdf8fc",
  color: active ? "#ffffff" : "#1f2937"
});