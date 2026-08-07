/**
 * Đảm bảo chuỗi ngày tháng luôn được parse chuẩn UTC nếu chưa có timezone offset
 * @param {string|Date} timestamp 
 * @returns {Date}
 */
export const parseUTC = (timestamp) => {
  if (!timestamp) return new Date(0);
  
  // Nếu đã là Date object, cứ dùng
  if (timestamp instanceof Date) return timestamp;

  const s = String(timestamp);
  // Backend C# gửi DateTime.UtcNow dạng "2026-04-23T08:00:00" không có Z
  // Thêm Z vào cuối để browser hiểu đây là UTC time thay vì local time.
  const utcString = s.endsWith("Z") || s.includes("+") ? s : s + "Z";
  return new Date(utcString);
};

/**
 * Format Date sang chuẩn giờ Việt Nam (UTC+7) cho dù người dùng mở app ở nước ngoài
 * @param {string|Date} timestamp 
 * @param {boolean} includeTime - Có bao gồm giờ phút không
 * @returns {string} Ví dụ: 23/04/2026 hoặc 23/04/2026 15:30
 */
export const formatDateVN = (timestamp, includeTime = true) => {
  if (!timestamp) return "—";
  
  const date = parseUTC(timestamp);
  
  // Kiểm tra ngày mặc định/trống từ C# (DateTime.MinValue: 0001-01-01)
  if (isNaN(date.getTime()) || date.getFullYear() <= 1) {
    return "—";
  }
  
  const options = {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
    options.second = "2-digit";
  }

  return date.toLocaleString("vi-VN", options);
};

/**
 * Hiển thị thời gian tương đối (vd: 5 phút trước)
 * @param {string|Date} timestamp 
 * @returns {string}
 */
export const getRelativeTime = (timestamp) => {
  if (!timestamp) return "";
  
  const date = parseUTC(timestamp);
  
  // Kiểm tra ngày mặc định/trống từ C# (DateTime.MinValue: 0001-01-01)
  if (isNaN(date.getTime()) || date.getFullYear() <= 1) {
    return "—";
  }
  
  const now = new Date();
  const diffMs = now - date;
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return formatDateVN(timestamp, false);
};
