import { useState, useEffect } from "react";
import {
  Phone, Store, MapPin, Mail, Loader2, Trash2,
  Check, Clock, ClipboardCheck, Filter, MessageSquare
} from "lucide-react";
import toast from "react-hot-toast";
import { getConsultations, updateConsultStatus, deleteConsultation } from "@/api/cmsLandingApi";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "New", label: "Mới" },
  { value: "Contacted", label: "Đã liên hệ" },
  { value: "Done", label: "Hoàn tất" },
];

const STATUS_STYLE = {
  New:       { bg: "bg-blue-50 text-blue-600 border-blue-200", icon: <Clock size={11} /> },
  Contacted: { bg: "bg-orange-50 text-orange-600 border-orange-200", icon: <Phone size={11} /> },
  Done:      { bg: "bg-green-50 text-green-600 border-green-200", icon: <Check size={11} /> },
};

export default function ConsultationsManager({ isAdmin = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState(null);

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

  const handleDelete = async (item) => {
    if (!confirm(`Xóa yêu cầu của "${item.fullName}"?`)) return;
    try {
      await deleteConsultation(item.requestId);
      setItems((prev) => prev.filter((i) => i.requestId !== item.requestId));
      toast.success("Đã xóa.");
    } catch {
      toast.error("Xóa thất bại.");
    }
  };

  const counts = {
    New:       items.filter((i) => i.status === "New").length,
    Contacted: items.filter((i) => i.status === "Contacted").length,
    Done:      items.filter((i) => i.status === "Done").length,
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
          <div className="flex gap-3 mt-2">
            {Object.entries(counts).map(([k, v]) => (
              <span key={k} className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[k]?.bg}`}>
                {k === "New" ? "Mới" : k === "Contacted" ? "Đã liên hệ" : "Xong"}: {v}
              </span>
            ))}
          </div>
        </div>
        {/* Filter */}
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
            const s = STATUS_STYLE[item.status] || STATUS_STYLE.New;
            const isOpen = expanded === item.requestId;
            return (
              <div
                key={item.requestId}
                className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors"
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
                        {s.icon} {item.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><Store size={11} />{item.restaurantName}</span>
                      <span className="flex items-center gap-1"><Phone size={11} />{item.phoneNumber}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{item.area}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50/50">
                    <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
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

                    {/* Actions — chỉ Admin */}
                    {isAdmin && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {["New", "Contacted", "Done"].map((st) => (
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
                            {st === "New" ? "Mới" : st === "Contacted" ? "Đã liên hệ" : "Hoàn tất"}
                          </button>
                        ))}
                        <button
                          onClick={() => handleDelete(item)}
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
    </div>
  );
}
