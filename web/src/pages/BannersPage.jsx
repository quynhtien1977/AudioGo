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
  Globe,
  Calendar,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Languages,
  Check,
  Info,
} from "lucide-react";
import { bannerApi } from "@/api/bannerApi";
import { formatDateVN } from "@/utils/formatDate";
import PageHeader from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";
import ConfirmModal from "@/components/ConfirmModal";
import EmptyState from "@/components/EmptyState";
import PageLoader from "@/components/PageLoader";
import HelpGuide from "@/components/HelpGuide";
import { SimpleTooltip } from "@/components/ui/tooltip";

export const BANNER_LANGUAGES = [
  { code: "vi", label: "Tiếng Việt", short: "VI", flag: "https://flagcdn.com/w40/vn.png", isMaster: true },
  { code: "en", label: "English",    short: "EN", flag: "https://flagcdn.com/w40/us.png" },
  { code: "ja", label: "日本語",      short: "JA", flag: "https://flagcdn.com/w40/jp.png" },
  { code: "ko", label: "한국어",      short: "KO", flag: "https://flagcdn.com/w40/kr.png" },
  { code: "zh-Hans", label: "中文",  short: "ZH", flag: "https://flagcdn.com/w40/cn.png" },
  { code: "fr", label: "Français",   short: "FR", flag: "https://flagcdn.com/w40/fr.png" },
  { code: "th", label: "ไทย",        short: "TH", flag: "https://flagcdn.com/w40/th.png" },
  { code: "es", label: "Español",    short: "ES", flag: "https://flagcdn.com/w40/es.png" },
];

export const safeJsonParse = (val) => {
  if (!val) return {};
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return {};
  }
};

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
  titleTranslations: {},
  subtitleTranslations: {},
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
  const [activeLang, setActiveLang] = useState("vi");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Auto translate state
  const [translating, setTranslating] = useState(false);

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
    setActiveLang("vi");
    // Tự động gợi ý thứ tự tiếp theo = Max(sortOrder) + 1
    const maxOrder = banners.reduce((max, b) => Math.max(max, Number(b.sortOrder) || 0), 0);
    setForm({
      ...EMPTY_FORM,
      sortOrder: maxOrder + 1,
      titleTranslations: {},
      subtitleTranslations: {},
    });
    setShowForm(true);
  };

  const openEdit = (banner) => {
    setEditId(banner.bannerId);
    setActiveLang("vi");
    const tTrans = safeJsonParse(banner.titleTranslations);
    const sTrans = safeJsonParse(banner.subtitleTranslations);
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
      titleTranslations: tTrans,
      subtitleTranslations: sTrans,
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

  const handleTranslationChange = (field, langCode, val) => {
    if (field === "title") {
      setForm((prev) => ({
        ...prev,
        titleTranslations: {
          ...(prev.titleTranslations || {}),
          [langCode]: val,
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        subtitleTranslations: {
          ...(prev.subtitleTranslations || {}),
          [langCode]: val,
        },
      }));
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Vui lòng nhập tiêu đề banner (Tiếng Việt).");
    if (!form.imageUrl.trim()) return toast.error("Vui lòng tải lên ảnh hoặc nhập URL ảnh.");

    setSaving(true);
    try {
      const cleanTitleTrans = { ...(form.titleTranslations || {}) };
      if (form.title.trim()) cleanTitleTrans.vi = form.title.trim();

      const cleanSubtitleTrans = { ...(form.subtitleTranslations || {}) };
      if (form.subtitle?.trim()) cleanSubtitleTrans.vi = form.subtitle.trim();

      const payload = {
        ...form,
        displayTarget: "Landing",
        sortOrder: Math.max(1, Number(form.sortOrder) || 1),
        startDate: form.startDate ? new Date(`${form.startDate}T00:00:00`).toISOString() : null,
        endDate: form.endDate ? new Date(`${form.endDate}T23:59:59.999`).toISOString() : null,
        titleTranslations: Object.keys(cleanTitleTrans).length > 0 ? JSON.stringify(cleanTitleTrans) : null,
        subtitleTranslations: Object.keys(cleanSubtitleTrans).length > 0 ? JSON.stringify(cleanSubtitleTrans) : null,
      };

      if (editId) {
        await bannerApi.update(editId, payload);
        toast.success("Đã cập nhật banner thành công!");
      } else {
        await bannerApi.create(payload);
        toast.success("Đã tạo banner mới thành công!");
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

  const handleAutoTranslate = async () => {
    if (!form.title.trim()) {
      return toast.error("Vui lòng nhập Tiêu đề (Tiếng Việt) trước khi dịch tự động.");
    }
    setTranslating(true);
    try {
      const res = await bannerApi.autoTranslate({
        title: form.title.trim(),
        subtitle: form.subtitle?.trim() || null,
      });

      const { titleTranslations = {}, subtitleTranslations = {} } = res.data;

      setForm((prev) => ({
        ...prev,
        titleTranslations: {
          ...(prev.titleTranslations || {}),
          ...titleTranslations,
          vi: prev.title,
        },
        subtitleTranslations: {
          ...(prev.subtitleTranslations || {}),
          ...subtitleTranslations,
          ...(prev.subtitle ? { vi: prev.subtitle } : {}),
        },
      }));

      const count = Object.keys(titleTranslations).length;
      toast.success(`Đã dịch tự động sang ${count} ngôn ngữ thành công!`);
      // Chuyển sang tab tiếng Anh để admin xem ngay kết quả dịch
      setActiveLang("en");
    } catch (err) {
      const msg = err?.response?.data?.message || "Lỗi khi gọi dịch tự động AI";
      toast.error(msg);
    } finally {
      setTranslating(false);
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
          <div className="flex items-center gap-2">
            <HelpGuide
              title="Hướng dẫn Quản lý Banners & Sự kiện"
              steps={[
                "<strong>Tạo Banner mới</strong>: Bấm 'Tạo Banner Mới', điền tiêu đề tiếng Việt và tải lên ảnh banner tỉ lệ 16:7.",
                "<strong>Dịch thuật AI</strong>: Sử dụng nút 'Dịch tự động AI' để hệ thống dịch tiêu đề và phụ đề sang các ngôn ngữ khác.",
                "<strong>Bật / Tắt hiển thị</strong>: Bạn có thể chuyển đổi nhanh trạng thái Đang Hiện / Đang Ẩn của banner trên thẻ danh sách.",
                "<strong>Thứ tự sắp xếp</strong>: Banner có số thứ tự (sortOrder) nhỏ hơn sẽ hiển thị trước trên thanh quảng cáo Landing Page."
              ]}
              tips={[
                "Nên sử dụng ảnh banner có độ phân giải tối thiểu 1200x525 px để đảm bảo chất lượng sắc nét trên mọi màn hình.",
                "Có thể gắn link liên kết ngoài (ví dụ fanpage, bài viết) hoặc liên kết nội bộ để dẫn người dùng khi họ nhấp vào banner."
              ]}
            />
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-pink-100 hover:shadow-lg transition-all text-sm cursor-pointer"
            >
              <Plus size={18} />
              Tạo Banner Mới
            </button>
          </div>
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
                  {/* Translation status badges */}
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                        <Languages size={11} className="text-pink-500" /> Ngôn ngữ
                      </span>
                      {(() => {
                        const tObj = safeJsonParse(banner.titleTranslations);
                        const count = Object.keys(tObj).filter((k) => k !== "vi" && tObj[k]?.trim()).length;
                        return count > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {count}/{BANNER_LANGUAGES.length - 1} ngoại ngữ
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            Chỉ Tiếng Việt
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {BANNER_LANGUAGES.map((l) => {
                        const tObj = safeJsonParse(banner.titleTranslations);
                        const isReady = l.isMaster ? true : !!tObj[l.code]?.trim();
                        return (
                          <span
                            key={l.code}
                            title={`${l.label} (${l.short}): ${isReady ? "Đã có bản dịch" : "Chưa có bản dịch"}`}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                              isReady
                                ? "bg-pink-50 text-pink-700 border-pink-200"
                                : "bg-gray-50 text-gray-300 border-gray-100 opacity-60"
                            }`}
                          >
                            <img src={l.flag} alt={l.code} className="w-3.5 h-2.5 object-cover rounded-[1px]" />
                            <span>{l.short}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD ACTIONS */}
              <div className="px-5 py-3 bg-[#FFF0F5]/50 border-t border-pink-100/40 flex items-center justify-between">
                <SimpleTooltip content={banner.isActive ? "Bấm để ẩn banner trên Landing page" : "Bấm để hiển thị banner trên Landing page"}>
                  <button
                    onClick={() => handleToggle(banner)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
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
                </SimpleTooltip>

                <div className="flex items-center gap-2">
                  <SimpleTooltip content="Chỉnh sửa thông tin & bản dịch">
                    <button
                      onClick={() => openEdit(banner)}
                      className="p-2 rounded-xl text-pink-600 hover:bg-pink-100 transition-colors cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Pencil size={16} />
                    </button>
                  </SimpleTooltip>
                  <SimpleTooltip content="Xóa vĩnh viễn banner này">
                    <button
                      onClick={() => setDeleteTarget(banner)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Xóa banner"
                    >
                      <Trash2 size={16} />
                    </button>
                  </SimpleTooltip>
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
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-2xl border border-pink-100 max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200">
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
              <SimpleTooltip content="Đóng cửa sổ">
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </SimpleTooltip>
            </div>

            {/* Modal Form */}
            <div className="space-y-4 text-sm">
              {/* IMAGE UPLOAD & PREVIEW */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Ảnh Banner *
                </label>

                {form.imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-[16/7] border border-gray-200 group bg-gray-50 shadow-xs">
                    <img
                      src={form.imageUrl}
                      alt="Banner preview"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />

                    {/* Hover overlay: click anywhere on preview to pick a new image */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      title="Bấm để đổi ảnh mới"
                    >
                      <span className="px-3.5 py-2 rounded-xl bg-black/70 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-2 shadow-lg border border-white/20 hover:scale-105 transition-transform">
                        <Upload size={14} /> Bấm để đổi ảnh mới
                      </span>
                    </div>

                    {/* Action button at top-right: only remove button */}
                    <div className="absolute top-3 right-3 z-10">
                      <SimpleTooltip content="Gỡ ảnh">
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                          className="p-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-all cursor-pointer hover:scale-105 active:scale-95"
                        >
                          <X size={14} />
                        </button>
                      </SimpleTooltip>
                    </div>

                    {/* Upload spinner overlay */}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
                        <Loader2 size={30} className="animate-spin text-pink-400" />
                        <span className="text-xs font-bold text-white tracking-wide">Đang tải ảnh mới lên Cloud...</span>
                      </div>
                    )}
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

              {/* MULTI-LANGUAGE TABS & CONTENT SECTION */}
              <div className="rounded-2xl border border-pink-100 bg-gradient-to-b from-[#FFF7FA] to-white p-4 sm:p-5 shadow-xs space-y-4">
                {/* Section Header with Title & Auto-translate AI Button */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-pink-100/70">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center shadow-xs">
                      <Languages size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Nội dung & Dịch thuật đa ngôn ngữ
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        Chọn từng tab để xem trước hoặc bấm nút AI để tự động dịch sang 7 ngôn ngữ
                      </p>
                    </div>
                  </div>

                  <SimpleTooltip content="Tự động dịch sang các ngôn ngữ khác bằng AI">
                    <button
                      type="button"
                      onClick={handleAutoTranslate}
                      disabled={translating || !form.title.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      {translating ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Sparkles size={14} />
                      )}
                      <span>{translating ? "Đang dịch AI..." : "Dịch tự động AI"}</span>
                    </button>
                  </SimpleTooltip>
                </div>

                {/* Language Tabs Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                  {BANNER_LANGUAGES.map((lang) => {
                    const isCurrent = activeLang === lang.code;
                    const hasText = lang.isMaster
                      ? !!form.title.trim()
                      : !!form.titleTranslations?.[lang.code]?.trim();

                    return (
                      <SimpleTooltip
                        key={lang.code}
                        content={`${lang.label} (${lang.short}) — ${hasText ? "Đã có dữ liệu" : "Chưa có dữ liệu"}`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveLang(lang.code)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 border cursor-pointer ${
                            isCurrent
                              ? "bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-200/60"
                              : "bg-white text-gray-700 hover:bg-pink-50/70 border-gray-200"
                          }`}
                        >
                          <img
                            src={lang.flag}
                            alt={lang.code}
                            className="w-4 h-3 object-cover rounded-[2px] shadow-xs"
                          />
                          <span>{lang.short}</span>
                          {lang.isMaster && (
                            <span
                              className={`text-[9px] px-1 rounded uppercase ${
                                isCurrent ? "bg-white/30 text-white" : "bg-pink-100 text-pink-600"
                              }`}
                            >
                              Gốc
                            </span>
                          )}
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              hasText
                                ? isCurrent ? "bg-emerald-200" : "bg-emerald-500"
                                : isCurrent ? "bg-white/40" : "bg-gray-300"
                            }`}
                          />
                        </button>
                      </SimpleTooltip>
                    );
                  })}
                </div>

                {/* Active Language Form Content */}
                <div className="pt-2">
                  {activeLang === "vi" ? (
                    /* Tab Tiếng Việt Gốc */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-pink-700 bg-pink-50/70 px-3 py-2 rounded-xl border border-pink-100">
                        <span className="font-semibold">
                          Ngôn ngữ gốc (Tiếng Việt)
                        </span>
                        <span className="text-[11px] text-gray-500">
                          Nhập tiêu đề tiếng Việt rồi bấm nút "Dịch tự động AI" ở trên để dịch sang các ngôn ngữ khác
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Tiêu đề Banner (VI) *
                          </label>
                          <input
                            type="text"
                            placeholder="VD: Tuần Lễ Ẩm Thực Vĩnh Khánh"
                            value={form.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm((f) => ({
                                ...f,
                                title: val,
                                titleTranslations: { ...(f.titleTranslations || {}), vi: val },
                              }));
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-pink-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Phụ đề Banner (VI)
                          </label>
                          <input
                            type="text"
                            placeholder="VD: Giảm 20% khi quét QR tại phố"
                            value={form.subtitle}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm((f) => ({
                                ...f,
                                subtitle: val,
                                subtitleTranslations: { ...(f.subtitleTranslations || {}), vi: val },
                              }));
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-pink-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Tab Ngôn ngữ khác (EN, JA, KO, ZH, FR, TH, ES) */
                    <div className="space-y-3">
                      {/* Reference block showing Vietnamese original */}
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-amber-800 font-bold text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <Info size={13} className="text-amber-600 flex-shrink-0" />
                            Đối chiếu bản gốc Tiếng Việt:
                          </span>
                          <span className="text-[10px] font-normal text-amber-700">
                            (Chuyển sang tab VI để sửa bản gốc)
                          </span>
                        </div>
                        <p className="text-gray-800 font-medium truncate">
                          <strong className="text-gray-500">Tiêu đề:</strong>{" "}
                          {form.title || <span className="italic text-gray-400">(Chưa nhập ở tab VI)</span>}
                        </p>
                        {form.subtitle && (
                          <p className="text-gray-700 truncate">
                            <strong className="text-gray-500">Phụ đề:</strong> {form.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Edit inputs for this foreign language */}
                      {(() => {
                        const currentLang =
                          BANNER_LANGUAGES.find((l) => l.code === activeLang) || BANNER_LANGUAGES[1];
                        const currentTitle = form.titleTranslations?.[activeLang] || "";
                        const currentSubtitle = form.subtitleTranslations?.[activeLang] || "";

                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                  <img
                                    src={currentLang.flag}
                                    alt=""
                                    className="w-3.5 h-2.5 object-cover rounded-xs"
                                  />
                                  Tiêu đề ({currentLang.label})
                                </label>
                                <input
                                  type="text"
                                  placeholder={`Bản dịch tiêu đề ${currentLang.label}...`}
                                  value={currentTitle}
                                  onChange={(e) =>
                                    handleTranslationChange("title", activeLang, e.target.value)
                                  }
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-pink-500"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                  <img
                                    src={currentLang.flag}
                                    alt=""
                                    className="w-3.5 h-2.5 object-cover rounded-xs"
                                  />
                                  Phụ đề ({currentLang.label})
                                </label>
                                <input
                                  type="text"
                                  placeholder={`Bản dịch phụ đề ${currentLang.label}...`}
                                  value={currentSubtitle}
                                  onChange={(e) =>
                                    handleTranslationChange("subtitle", activeLang, e.target.value)
                                  }
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-pink-500"
                                />
                              </div>
                            </div>

                            {/* Quick actions for this language tab */}
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-pink-100/60 mt-1">
                              <div className="flex items-center gap-1.5 text-xs">
                                {currentTitle ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md text-[11px] font-medium border border-emerald-200">
                                    <Check size={12} />
                                    Đã có bản dịch ({currentLang.label})
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-gray-400">
                                    Chưa có bản dịch — sẽ hiển thị theo Tiếng Việt gốc
                                  </span>
                                )}
                              </div>

                              {(currentTitle || currentSubtitle) && (
                                <SimpleTooltip content={`Xóa toàn bộ bản dịch tiếng ${currentLang.label}`}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleTranslationChange("title", activeLang, "");
                                      handleTranslationChange("subtitle", activeLang, "");
                                      toast.success(`Đã xóa bản dịch ${currentLang.label}`);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 active:bg-rose-200/60 border border-rose-200 transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                    <span>Xóa bản dịch {currentLang.short}</span>
                                  </button>
                                </SimpleTooltip>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
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
                <SimpleTooltip content={form.isActive ? "Bấm để chuyển sang trạng thái Ẩn" : "Bấm để chuyển sang trạng thái Hiện"}>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
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
                </SimpleTooltip>
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
