import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  X,
  CheckCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  EyeOff,
  Package,
  Clock,
  Megaphone,
  Trash2,
} from "lucide-react";
import { notificationApi } from "../api/notificationApi";
import ConfirmModal from "./ConfirmModal";

// ─── Cấu hình Icon & Style theo loại notification (không dùng emoji) ────────
const TYPE_CONFIG = {
  PoiApproved: {
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  PoiRejected: {
    icon: XCircle,
    className: "bg-red-50 text-red-600 border-red-100",
  },
  PoiHidden: {
    icon: EyeOff,
    className: "bg-amber-50 text-amber-600 border-amber-100",
  },
  PlanAssigned: {
    icon: Package,
    className: "bg-purple-50 text-purple-600 border-purple-100",
  },
  SubscriptionExpiring: {
    icon: Clock,
    className: "bg-orange-50 text-orange-600 border-orange-100",
  },
  Broadcast: {
    icon: Megaphone,
    className: "bg-blue-50 text-blue-600 border-blue-100",
  },
};

const getTypeConfig = (type) =>
  TYPE_CONFIG[type] ?? {
    icon: Bell,
    className: "bg-gray-50 text-gray-600 border-gray-100",
  };

// ─── Định dạng thời gian tương đối ────────────────────────────────────────────
const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
};

// ─── Polling interval ──────────────────────────────────────────────────────────
const POLL_MS = 30_000; // 30 giây

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const dropdownRef = useRef(null);
  const pollRef = useRef(null);

  // ── Fetch unread count (polling) ─────────────────────────────────────────
  const fetchCount = useCallback(async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      const count = res.data?.count ?? 0;
      setUnreadCount(count);
    } catch {
      // silent
    }
  }, []);

  // ── Fetch all notifications (khi mở dropdown: lấy cả đã đọc và chưa đọc) ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getAll(1, 30);
      setNotifications(res.data ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Polling setup ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCount();
    pollRef.current = setInterval(fetchCount, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchCount]);

  // ── Open dropdown ────────────────────────────────────────────────────────
  const handleOpen = () => {
    setOpen((prev) => {
      if (!prev) {
        fetchAll();
        fetchCount();
      }
      return !prev;
    });
  };

  // ── Click outside → đóng ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Đánh dấu 1 tin đã đọc ─────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationApi.markRead(id);
    } catch {
      /* silent */
    }
  };

  // ── Đánh dấu TẤT CẢ đã đọc (KHÔNG xóa, chỉ chuyển sang mờ) ────────────────
  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* silent */
    } finally {
      setMarking(false);
    }
  };

  // ── Xóa lẻ 1 thông báo ───────────────────────────────────────────────────
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const item = notifications.find((n) => n.notificationId === id);
    if (item && !item.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setNotifications((prev) => prev.filter((n) => n.notificationId !== id));
    try {
      await notificationApi.deleteNotification(id);
    } catch {
      /* silent */
    }
  };

  // ── Xóa TẤT CẢ thông báo (mở modal xác nhận) ─────────────────────────────
  const handleDeleteAllClick = () => {
    if (notifications.length === 0) return;
    setShowConfirmModal(true);
  };

  const handleConfirmDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await notificationApi.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      setShowConfirmModal(false);
    } catch {
      /* silent */
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell Button ── */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-pink-50 transition-colors duration-150 cursor-pointer"
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell size={18} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          style={{ maxHeight: "500px", display: "flex", flexDirection: "column" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-800">
                Thông báo
              </span>
              {unreadCount > 0 ? (
                <span className="text-xs text-white bg-red-500 font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              ) : (
                <span className="text-xs text-gray-400 font-normal">
                  ({notifications.length})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={marking}
                  className="text-xs text-pink-600 hover:text-pink-800 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Đánh dấu tất cả đã đọc"
                >
                  {marking ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCheck size={13} />
                  )}
                  Đọc tất cả
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAllClick}
                  disabled={deletingAll}
                  className="text-xs text-gray-400 hover:text-red-600 font-medium flex items-center gap-1 transition-colors cursor-pointer ml-1"
                  title="Xóa tất cả thông báo"
                >
                  {deletingAll ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  Xóa hết
                </button>
              )}

              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-gray-400 hover:text-gray-600 ml-1"
                aria-label="Đóng"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={22} className="animate-spin text-pink-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                  <Bell size={24} strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-gray-500">Không có thông báo nào</p>
                <p className="text-xs text-gray-400">Tất cả thông báo sẽ hiển thị tại đây</p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const { icon: IconComponent, className: iconStyle } =
                    getTypeConfig(n.type);
                  return (
                    <li
                      key={n.notificationId}
                      className={`group relative flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !n.isRead ? "bg-pink-50/30" : "opacity-80"
                      }`}
                      onClick={() => !n.isRead && handleMarkRead(n.notificationId)}
                    >
                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                          !n.isRead
                            ? iconStyle
                            : "bg-gray-100 text-gray-400 border-gray-200"
                        }`}
                      >
                        <IconComponent size={15} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-start justify-between gap-1">
                          <p
                            className={`text-sm leading-snug ${
                              !n.isRead
                                ? "font-semibold text-gray-900"
                                : "font-medium text-gray-600"
                            }`}
                          >
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p
                          className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
                            !n.isRead ? "text-gray-600" : "text-gray-400"
                          }`}
                        >
                          {n.body}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                          {relativeTime(n.createdAt)}
                        </p>
                      </div>

                      {/* Xóa lẻ 1 thông báo (hiện khi hover hoặc mobile) */}
                      <button
                        onClick={(e) => handleDelete(n.notificationId, e)}
                        className="absolute right-3 top-3 p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Xóa thông báo này"
                        aria-label="Xóa thông báo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── Modal xác nhận xóa toàn bộ ── */}
      <ConfirmModal
        open={showConfirmModal}
        title="Xóa tất cả thông báo"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn toàn bộ thông báo không? Thao tác này không thể hoàn tác."
        confirmText="Xóa tất cả"
        cancelText="Hủy"
        variant="danger"
        isLoading={deletingAll}
        onConfirm={handleConfirmDeleteAll}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
}
