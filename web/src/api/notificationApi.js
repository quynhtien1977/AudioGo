import api from "./apiClient";

// ── Notification CMS API ──────────────────────────────────────────────────────

export const notificationApi = {
  /** Lấy danh sách chưa đọc của user hiện tại */
  getUnread: () =>
    api.get("/cms/notifications/unread"),

  /** Số lượng chưa đọc (dùng cho badge polling) */
  getUnreadCount: () =>
    api.get("/cms/notifications/unread/count"),

  /** Lấy tất cả notification có phân trang */
  getAll: (page = 1, pageSize = 20) =>
    api.get("/cms/notifications", { params: { page, pageSize } }),

  /** Admin tạo broadcast thủ công */
  createBroadcast: (data) =>
    api.post("/cms/notifications", data),

  /** Đánh dấu đã đọc (1 notification) */
  markRead: (notificationId) =>
    api.patch("/cms/notifications/read", { notificationId }),

  /** Đánh dấu tất cả đã đọc */
  markAllRead: () =>
    api.patch("/cms/notifications/read", { notificationId: null }),

  /** Xóa 1 notification */
  deleteNotification: (notificationId) =>
    api.delete(`/cms/notifications/${notificationId}`),

  /** Xóa toàn bộ notification của user */
  deleteAllNotifications: () =>
    api.delete("/cms/notifications"),
};
