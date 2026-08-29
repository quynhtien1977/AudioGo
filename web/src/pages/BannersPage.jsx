import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Upload,
  X,
  Loader2,
  ExternalLink,
  Monitor,
  Smartphone,
  Globe,
  Calendar,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { bannerApi } from "@/api/bannerApi";
import { formatDateVN } from "@/utils/formatDate";
import PageHeader from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";
import ConfirmModal from "@/components/ConfirmModal";
import EmptyState from "@/components/EmptyState";
import PageLoader from "@/components/PageLoader";

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  displayTarget: "Landing",
  startDate: "",
  endDate: "",
  isActive: true,
  sortOrder: 1,
};

function StatusBadge({ banner }) {
  const now = new Date();
  const start = banner.startDate ? new Date(banner.startDate) : null;
  const end = banner.endDate ? new Date(banner.endDate) : null;

  if (!banner.isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
        <EyeOff size={11} /> Đã ẩn
      </span>
    );
  }
  if (start && start > now) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
        <Clock size={11} /> Sắp tới
      </span>
    );
  }
  if (end && end < now) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
        <AlertTriangle size={11} /> Hết hạn
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
      <CheckCircle2 size={11} /> Đang hiển thị
    </span>
  );
}

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "active" | "hidden"

  // Form / Modal state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await bannerApi.getAll();
      setBanners(res.data || []);
    } catch (err) {
      toast.error("Không thể tải danh sách banners.");
    } finally {
      setLoading(false);
    }
  };

  // Stats calculation
  const totalCount = banners.length;
  const activeCount = banners.filter((b) => b.isActive).length;
  const hiddenCount = totalCount - activeCount;
  const linkCount = banners.filter((b) => b.linkUrl).length;

  // Filtered list
  const filteredBanners = banners.filter((b) => {
    if (filterStatus === "active") return b.isActive;
    if (filterStatus === "hidden") return !b.isActive;
    return true;
  });

  const openCreate = () => {
    setEditId(null);
    // Tự động gợi ý thứ tự tiếp theo = Max(sortOrder) + 1
    const maxOrder = banners.reduce((max, b) => Math.max(max, Number(b.sortOrder) || 0), 0);
    setForm({
      ...EMPTY_FORM,
      sortOrder: maxOrder + 1,
    });
    setShowForm(true);
  };

  const openEdit = (banner) => {
    setEditId(banner.bannerId);
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl || "",
      linkUrl: banner.linkUrl || "",
      displayTarget: "Landing",
      startDate: banner.startDate ? banner.startDate.slice(0, 10) : "",
      endDate: banner.endDate ? banner.endDate.slice(0, 10) : "",
      isActive: banner.isActive ?? true,
      sortOrder: banner.sortOrder ?? 1,
    });
    setShowForm(true);
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await bannerApi.uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: res.data.url }));
      toast.success("Đã upload ảnh thành công!");
    } catch {
      toast.error("Upload ảnh thất bại.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Vui lòng nhập tiêu đề banner.");
    if (!form.imageUrl.trim()) return toast.error("Vui lòng tải lên ảnh hoặc nhập URL ảnh.");

    setSaving(true);
    try {
      const payload = {
        ...form,
        displayTarget: "Landing",
        sortOrder: Math.max(1, Number(form.sortOrder) || 1),
        startDate: form.startDate ? new Date(`${form.startDate}T00:00:00`).toISOString() : null,
        endDate: form.endDate ? new Date(`${form.endDate}T23:59:59.999`).toISOString() : null,
      };

      if (editId) {
        await bannerApi.update(editId, payload);
        toast.success("Đã cập nhật banner!");
      } else {
        await bannerApi.create(payload);
        toast.success("Đã tạo banner mới!");
      }
      setShowForm(false);
      fetchBanners();
    } catch {
      toast.error("Lưu banner thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (banner) => {
    try {
      await bannerApi.toggle(banner.bannerId);
      setBanners((prev) =>
        prev.map((b) =>
          b.bannerId === banner.bannerId ? { ...b, isActive: !b.isActive } : b
        )
      );
      toast.success(banner.isActive ? "Đã ẩn banner" : "Đã kích hoạt banner");
    } catch {
      toast.error("Thao tác thất bại.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await bannerApi.delete(deleteTarget.bannerId);
      toast.success("Đã xóa banner thành công.");
      setDeleteTarget(null);
      fetchBanners();
    } catch {
      toast.error("Xóa thất bại.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="QUẢN LÝ BANNERS & SỰ KIỆN"
        description="Đăng tải và quản lý banner quảng cáo, sự kiện và khuyến mãi nổi bật trên Landing Page AudioGo."
        icon={<Megaphone size={24} />}
        actionButton={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-pink-100 hover:shadow-lg transition-all text-sm"
          >
            <Plus size={18} />
            Tạo Banner Mới
          </button>
        }
      />

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="TỔNG BANNERS"
          value={totalCount}
          sub="Tất cả banner"
          icon={<Megaphone size={20} />}
        />
        <StatsCard
          title="ĐANG HIỂN THỊ"
          value={activeCount}
          sub="Đang phát hành"
          color="text-emerald-600"
          icon={<CheckCircle2 size={20} />}
        />
        <StatsCard
          title="ĐÃ TẮT / ẨN"
          value={hiddenCount}
          sub="Chưa kích hoạt"
          color="text-gray-500"
          icon={<EyeOff size={20} />}
        />
        <StatsCard
          title="CÓ LIÊN KẾT"
          value={linkCount}
          sub="Dẫn đến liên kết"
          color="text-blue-600"
          icon={<Globe size={20} />}
        />
      </div>

      {/* FILTER TABS */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-pink-100/30 shadow-sm flex items-center justify-between gap-4">
        <div className="flex bg-[#FFF0F5] p-1 rounded-xl gap-1">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterStatus === "all"
                ? "bg-white text-pink-600 shadow-sm"
                : "text-[#8E707E] hover:text-pink-600"
            }`}
          >
            Tất cả ({totalCount})
          </button>
          <button
            onClick={() => setFilterStatus("active")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterStatus === "active"
                ? "bg-white text-pink-600 shadow-sm"
                : "text-[#8E707E] hover:text-pink-600"
            }`}
          >
            Đang bật ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus("hidden")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterStatus === "hidden"
                ? "bg-white text-pink-600 shadow-sm"
                : "text-[#8E707E] hover:text-pink-600"
            }`}
          >
            Đã tắt ({hiddenCount})
          </button>
        </div>
      </div>

      {/* BANNER GRID */}
      {loading ? (
        <PageLoader text="Đang tải danh sách banner..." />
      ) : filteredBanners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-pink-100/30 p-12 shadow-sm">
          <EmptyState
            icon={<Megaphone size={40} className="text-pink-300" />}
            title="Chưa có banner nào"
            description="Hãy bấm 'Tạo Banner Mới' để đăng tải chương trình khuyến mãi hoặc sự kiện đầu tiên."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((banner) => (
            <div
              key={banner.bannerId}
              className="bg-white rounded-2xl border border-pink-100/50 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
            >
              {/* IMAGE HEADER */}
              <div className="aspect-[16/7] bg-pink-50/50 relative overflow-hidden border-b border-pink-50">
                {banner.imageUrl ? (
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-pink-300">
                    <Megaphone size={32} />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <StatusBadge banner={banner} />
                </div>
              </div>

              {/* CARD CONTENT */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-base line-clamp-1 group-hover:text-pink-600 transition-colors">
                    {banner.title}
                  </h3>
                  {banner.subtitle ? (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {banner.subtitle}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1 italic">Không có phụ đề</p>
                  )}
                </div>

                {/* META INFO */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-1.5 text-xs text-gray-500">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Calendar size={13} />
                      {banner.startDate ? formatDateVN(banner.startDate) : "Ngay lập tức"}
                      {" → "}
                      {banner.endDate ? formatDateVN(banner.endDate) : "Vô thời hạn"}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-50 text-pink-600 font-bold text-[11px]">
                      <Sliders size={11} /> Vị trí #{banner.sortOrder}
                    </span>
                  </div>

                  {banner.linkUrl && (
                    <a
                      href={banner.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-xs truncate mt-1"
                    >
                      <ExternalLink size={12} className="flex-shrink-0" />
                      <span className="truncate">{banner.linkUrl}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* CARD ACTIONS */}
              <div className="px-5 py-3 bg-[#FFF0F5]/50 border-t border-pink-100/40 flex items-center justify-between">
                <button
                  onClick={() => handleToggle(banner)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    banner.isActive
                      ? "bg-pink-500/10 text-pink-600 border-pink-200 hover:bg-pink-500/20"
                      : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  {banner.isActive ? (
                    <>
                      <Eye size={12} />
                      Đang Hiện
                    </>
                  ) : (
                    <>
                      <EyeOff size={12} />
                      Đang Ẩn
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(banner)}
                    className="p-2 rounded-xl text-pink-600 hover:bg-pink-100 transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(banner)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                    title="Xóa banner"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showForm &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl border border-pink-100 max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-50 text-pink-500">
                  <Megaphone size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  {editId ? "Chỉnh Sửa Banner" : "Tạo Banner Mới"}
                </h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <div className="space-y-4 text-sm">
              {/* IMAGE UPLOAD & PREVIEW */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Ảnh Banner *
                </label>
                {form.imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden aspect-[16/7] border border-gray-200 group bg-gray-50">
                    <img
                      src={form.imageUrl}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"
                      title="Gỡ ảnh"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-pink-200 hover:border-pink-500 rounded-2xl aspect-[16/7] flex flex-col items-center justify-center gap-2 cursor-pointer bg-pink-50/20 hover:bg-pink-50/40 transition-colors p-4"
                  >
                    {uploading ? (
                      <Loader2 size={28} className="animate-spin text-pink-500" />
                    ) : (
                      <Upload size={28} className="text-pink-400" />
                    )}
                    <span className="text-xs font-bold text-pink-600">
                      {uploading ? "Đang tải ảnh lên Cloud..." : "Bấm để chọn ảnh từ máy tính (PNG, JPG, WebP)"}
                    </span>
                    <span className="text-[11px] text-gray-400">Tỷ lệ khuyến nghị 16:6 hoặc 4:1 (ví dụ 1200x450px)</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  className="hidden"
                />
                <input
                  type="text"
                  placeholder="Hoặc dán URL ảnh trực tiếp (https://...)"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  className="mt-2 w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* TITLE & SUBTITLE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tiêu đề *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Tuần Lễ Ẩm Thực Vĩnh Khánh"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Phụ đề
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Giảm 20% khi quét QR tại phố"
                    value={form.subtitle}
                    onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* LINK URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Link khi bấm vào (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="https://... hoặc #download, #features"
                  value={form.linkUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-pink-500"
                />
                <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                  Hỗ trợ link web ngoài (https://...) hoặc neo trang nội bộ (#download, #features, #how-it-works).
                </p>
              </div>

              {/* DATES & SORT ORDER */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-pink-500 font-bold"
                    placeholder="1"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                    Số 1 hiện đầu tiên. Nếu trùng số, banner mới hơn sẽ đứng trước.
                  </p>
                </div>
              </div>

              {/* IS ACTIVE TOGGLE */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFF0F5]/50 border border-pink-100">
                <div>
                  <span className="font-bold text-gray-800 text-sm block">Trạng thái kích hoạt</span>
                  <span className="text-xs text-gray-500">
                    Banner sẽ hiển thị đúng theo thời gian đã chọn khi được bật
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    form.isActive
                      ? "bg-pink-500/10 text-pink-600 border-pink-200"
                      : "bg-gray-100 text-gray-400 border-gray-200"
                  }`}
                >
                  {form.isActive ? (
                    <>
                      <Eye size={13} />
                      Đang Hiện
                    </>
                  ) : (
                    <>
                      <EyeOff size={13} />
                      Đang Ẩn
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-sm transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white font-bold text-sm shadow-md shadow-pink-100 transition-all disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Đang lưu..." : "Lưu Banner"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Xác nhận xóa Banner"
        message={`Bạn có chắc chắn muốn xóa banner "${deleteTarget?.title}"? Hành động này sẽ gỡ bỏ banner vĩnh viễn khỏi website và app.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
        variant="danger"
      />
    </div>
  );
}
