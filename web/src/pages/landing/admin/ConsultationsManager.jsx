import { useState, useEffect } from "react";
import {
  Phone, Store, MapPin, Mail, Loader2, Trash2,
  Check, Clock, ClipboardCheck, Filter, MessageSquare,
  UserPlus, XCircle, CalendarClock,
} from "lucide-react";
import toast from "react-hot-toast";
import { getConsultations, updateConsultStatus, deleteConsultation } from "@/api/cmsLandingApi";
import CreateAccountModal from "@/components/CreateAccountModal";
import ConfirmModal from "@/components/ConfirmModal";

const STATUS_OPTIONS = [
  { value: "",          label: "Tất cả" },
  { value: "New",       label: "Mới" },
  { value: "Contacted", label: "Đã liên hệ" },
  { value: "Done",      label: "Đã ký kết" },
  { value: "Rejected",  label: "Từ chối" },
];

const STATUS_STYLE = {
  New:       { bg: "bg-blue-50 text-blue-600 border-blue-200",       icon: <Clock size={11} /> },
  Contacted: { bg: "bg-orange-50 text-orange-600 border-orange-200", icon: <Phone size={11} /> },
  Done:      { bg: "bg-green-50 text-green-600 border-green-200",    icon: <Check size={11} /> },
  Rejected:  { bg: "bg-red-50 text-red-500 border-red-200",          icon: <XCircle size={11} /> },
};

const STATUS_LABEL = {
  New:       "Mới",
  Contacted: "Đã liên hệ",
  Done:      "Đã ký kết",
  Rejected:  "Từ chối",
};

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ConsultationsManager({ isAdmin = false }) {
  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded]         = useState(null);
  const [createModal, setCreateModal]   = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const refresh = (status = statusFilter) => {
    setLoading(true);
    getConsultations(status || undefined)
      .then(setItems)
      .catch(() => toast.error("Không tải được danh sách."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [statusFilter]);

  const handleStatusChange = async (item, newStatus) => {
    try {
      await updateConsultStatus(item.requestId, newStatus);
      setItems((prev) =>
        prev.map((i) =>
          i.requestId === item.requestId ? { ...i, status: newStatus } : i
        )
      );
      toast.success("Đã cập nhật trạng thái.");
    } catch {
      toast.error("Cập nhật thất bại.");
    }
  };

  const handleRequestReject = (item) => {
    setConfirmModal({
      title: "Từ chối yêu cầu tư vấn",
      message: `Bạn có chắc muốn từ chối yêu cầu của "${item.fullName}" (${item.restaurantName || "Chủ quán"})?`,
      confirmText: "Từ chối yêu cầu",
      variant: "danger",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await updateConsultStatus(item.requestId, "Rejected");
          setItems((prev) =>
            prev.map((i) =>
              i.requestId === item.requestId ? { ...i, status: "Rejected" } : i
            )
          );
          toast.success("Đã chuyển sang trạng thái từ chối.");
          setConfirmModal(null);
        } catch {
          toast.error("Cập nhật thất bại.");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleRequestDelete = (item) => {
    setConfirmModal({
      title: "Xóa yêu cầu tư vấn",
      message: `Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa yêu cầu tư vấn của "${item.fullName}"?`,
      confirmText: "Xóa vĩnh viễn",
      variant: "danger",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await deleteConsultation(item.requestId);
          setItems((prev) => prev.filter((i) => i.requestId !== item.requestId));
          toast.success("Đã xóa yêu cầu tư vấn.");
          setConfirmModal(null);
        } catch {
          toast.error("Xóa thất bại.");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const counts = {
    New:       items.filter((i) => i.status === "New").length,
    Contacted: items.filter((i) => i.status === "Contacted").length,
    Done:      items.filter((i) => i.status === "Done").length,
    Rejected:  items.filter((i) => i.status === "Rejected").length,
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardCheck size={16} className="text-pink-500" />
            Yêu cầu tư vấn từ chủ quán
          </h3>
          <div className="flex gap-2 mt-2 flex-wrap">
            {Object.entries(counts).map(([k, v]) => (
              <span key={k} className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[k]?.bg}`}>
                {STATUS_LABEL[k]}: {v}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-pink-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Không có yêu cầu nào.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const s          = STATUS_STYLE[item.status] || STATUS_STYLE.New;
            const isOpen     = expanded === item.requestId;
            const isDone     = item.status === "Done";
            const isRejected = item.status === "Rejected";
            const isClosed   = isDone || isRejected;

            return (
              <div
                key={item.requestId}
                className={`border rounded-xl overflow-hidden transition-colors ${
                  isRejected ? "border-red-100 bg-red-50/30" :
                  isDone     ? "border-green-100 bg-green-50/20" :
                               "border-gray-100 hover:border-gray-200"
                }`}
              >
                {/* Row */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : item.requestId)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{item.fullName}</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${s.bg}`}>
                        {s.icon} {STATUS_LABEL[item.status] || item.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><Store size={11} />{item.restaurantName}</span>
                      <span className="flex items-center gap-1"><Phone size={11} />{item.phoneNumber}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{item.area}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 hidden sm:inline flex-shrink-0">
                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50/50">

                    {/* Contact info */}
                    <div className="grid sm:grid-cols-2 gap-3 text-sm mb-3">
                      {item.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail size={13} className="text-pink-400" />
                          <a href={`mailto:${item.email}`} className="hover:underline">{item.email}</a>
                        </div>
                      )}
                      {item.message && (
                        <div className="flex items-start gap-2 text-gray-600 sm:col-span-2">
                          <MessageSquare size={13} className="text-pink-400 mt-0.5 flex-shrink-0" />
                          <span>{item.message}</span>
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="flex gap-4 mb-4 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarClock size={12} />
                        Gửi: {fmtDate(item.createdAt)}
                      </span>
                      {item.contactedAt && (
                        <span className="flex items-center gap-1 text-orange-500">
                          <Phone size={12} />
                          Liên hệ: {fmtDate(item.contactedAt)}
                        </span>
                      )}
                      {item.rejectedAt && (
                        <span className="flex items-center gap-1 text-red-400">
                          <XCircle size={12} />
                          Từ chối: {fmtDate(item.rejectedAt)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Chuyển trạng thái trung gian (chỉ khi chưa đóng) */}
                        {!isClosed && ["New", "Contacted"].map((st) => (
                          <button
                            key={st}
                            onClick={() => handleStatusChange(item, st)}
                            disabled={item.status === st}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              item.status === st
                                ? "bg-gray-100 text-gray-400 cursor-default"
                                : "bg-white border border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-500"
                            }`}
                          >
                            {st === "New" ? "Mới" : "Đã liên hệ"}
                          </button>
                        ))}

                        {/* Nút kết thúc (chỉ khi chưa đóng) */}
                        {!isClosed && (
                          <>
                            <button
                              onClick={() => handleStatusChange(item, "Done")}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
                            >
                              <Check size={13} />
                              Đã ký kết
                            </button>
                            <button
                              onClick={() => handleRequestReject(item)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors"
                            >
                              <XCircle size={13} />
                              Từ chối
                            </button>
                          </>
                        )}

                        {/* Tạo tài khoản (chỉ khi Done) */}
                        {isDone && (
                          <button
                            onClick={() => setCreateModal(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pink-500 text-white hover:bg-pink-600 transition-colors"
                          >
                            <UserPlus size={13} />
                            Tạo tài khoản
                          </button>
                        )}

                        {/* Mở lại nếu Rejected nhầm */}
                        {isRejected && (
                          <button
                            onClick={() => handleStatusChange(item, "New")}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors"
                          >
                            Mở lại
                          </button>
                        )}

                        <button
                          onClick={() => handleRequestDelete(item)}
                          className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}

                    {!isAdmin && (
                      <p className="text-xs text-gray-400 italic">Chỉ xem — liên hệ Admin để cập nhật trạng thái.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal tạo tài khoản */}
      {createModal && (
        <CreateAccountModal
          prefill={{
            fullName:    createModal.fullName,
            email:       createModal.email,
            phoneNumber: createModal.phoneNumber,
          }}
          onClose={() => setCreateModal(null)}
          onCreated={() => {
            toast.success(`Đã tạo tài khoản cho ${createModal.fullName}!`);
            setCreateModal(null);
          }}
        />
      )}

      {/* Modal xác nhận dùng chung */}
      {confirmModal && (
        <ConfirmModal
          open={!!confirmModal}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          variant={confirmModal.variant}
          isLoading={actionLoading}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => !actionLoading && setConfirmModal(null)}
        />
      )}
    </div>
  );
}
