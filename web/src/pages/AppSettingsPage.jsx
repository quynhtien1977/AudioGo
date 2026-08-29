import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Settings,
  Sliders,
  Pencil,
  DollarSign,
  Clock,
  QrCode,
  Save,
  Loader2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { appSettingApi } from "@/api/bannerApi";
import PageHeader from "@/components/PageHeader";
import PageLoader from "@/components/PageLoader";

const SETTING_CONFIGS = {
  "TouristAccess.PriceVnd": {
    label: "Giá Vé Vào App Qua SePay",
    subtitle: "Số tiền chuyển khoản cố định khi du khách quét VietQR mở khóa app",
    tag: "Thanh toán SePay",
    unit: "₫",
    icon: DollarSign,
    color: "text-pink-600",
    bgIcon: "bg-pink-50 text-pink-500 border-pink-100",
    presets: [10000, 15000, 20000, 30000, 50000],
    validate: (v) => {
      const n = Number(v);
      if (isNaN(n) || n < 1000) return "Giá vé tối thiểu là 1.000 ₫.";
      if (n % 1000 !== 0) return "Giá vé phải là bội số của 1.000 ₫ (vd: 10.000, 15.000).";
      return null;
    },
    format: (v) => Number(v || 10000).toLocaleString("vi-VN") + " ₫",
  },
  "TouristAccess.DurationDays": {
    label: "Thời Hạn Gói SePay",
    subtitle: "Số ngày hiệu lực của Token JWT cấp cho khách sau khi thanh toán SePay thành công",
    tag: "Thời hạn vé SePay",
    unit: "ngày",
    icon: Clock,
    color: "text-blue-600",
    bgIcon: "bg-blue-50 text-blue-500 border-blue-100",
    presets: [3, 7, 14, 30, 90, 365],
    validate: (v) => {
      const n = parseInt(v);
      if (isNaN(n) || n < 1) return "Thời hạn tối thiểu là 1 ngày.";
      return null;
    },
    format: (v) => `${v || 7} ngày`,
  },
  "AppAccessCode.DefaultDurationDays": {
    label: "Thời Hạn Mã QR Dùng Thử",
    subtitle: "Thời hạn mặc định khi khách quét mã Access Code (có thể override riêng từng mã)",
    tag: "Mã QR Access Code",
    unit: "ngày",
    icon: QrCode,
    color: "text-purple-600",
    bgIcon: "bg-purple-50 text-purple-500 border-purple-100",
    presets: [1, 3, 7, 14, 30],
    validate: (v) => {
      const n = parseInt(v);
      if (isNaN(n) || n < 1) return "Thời hạn tối thiểu là 1 ngày.";
      return null;
    },
    format: (v) => `${v || 7} ngày`,
  },
};

export default function AppSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [errorMap, setErrorMap] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await appSettingApi.getAll();
      setSettings(res.data || []);
    } catch {
      toast.error("Không tải được danh sách cài đặt.");
    } finally {
      setLoading(false);
    }
  };

  const getDbValue = (key) =>
    settings.find((s) => s.settingKey === key)?.settingValue ?? null;

  const getUpdatedAt = (key) =>
    settings.find((s) => s.settingKey === key)?.updatedAt ?? null;

  const getUpdatedBy = (key) =>
    settings.find((s) => s.settingKey === key)?.updatedByAccountId ?? null;

  const handleStartEdit = (key) => {
    const currentVal = getDbValue(key) ?? (key === "TouristAccess.PriceVnd" ? "10000" : "7");
    setEditValues((prev) => ({ ...prev, [key]: currentVal }));
    setErrorMap((prev) => ({ ...prev, [key]: null }));
  };

  const handleCancelEdit = (key) => {
    setEditValues((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setErrorMap((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handlePresetClick = (key, val) => {
    setEditValues((prev) => ({ ...prev, [key]: String(val) }));
    setErrorMap((prev) => ({ ...prev, [key]: null }));
  };

  const handleSave = async (key) => {
    const rawVal = editValues[key]?.trim();
    if (rawVal === undefined) return;

    const config = SETTING_CONFIGS[key];
    if (config?.validate) {
      const err = config.validate(rawVal);
      if (err) {
        setErrorMap((prev) => ({ ...prev, [key]: err }));
        return;
      }
    }

    setSavingKey(key);
    try {
      await appSettingApi.update(key, rawVal);
      toast.success(`Đã cập nhật "${config?.label || key}" thành công!`);
      handleCancelEdit(key);
      fetchSettings();
    } catch {
      toast.error("Lưu cấu hình thất bại.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <PageHeader
        title="CÀI ĐẶT HỆ THỐNG"
        description="Quản lý giá vé vào app SePay, thời hạn hiệu lực Token và chính sách mã QR trực tiếp từ giao diện."
        icon={<Settings size={24} />}
      />

      {/* ALERT BANNER */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-600 flex-shrink-0 mt-0.5">
          <AlertTriangle size={20} />
        </div>
        <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          <p className="font-bold text-amber-950">Lưu ý về phạm vi áp dụng:</p>
          <p className="text-amber-800/90 mt-0.5">
            Khi thay đổi giá vé hoặc thời hạn, giá trị mới sẽ <strong>áp dụng ngay lập tức cho các giao dịch VietQR và mã kích hoạt mới</strong>.
            Những du khách đã thanh toán hoặc đã quét mã trước đó sẽ giữ nguyên thời hạn Token đã cấp cho đến khi hết hạn.
          </p>
        </div>
      </div>

      {/* SETTINGS LIST */}
      {loading ? (
        <PageLoader text="Đang tải cấu hình hệ thống..." />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(SETTING_CONFIGS).map(([key, config]) => {
            const Icon = config.icon;
            const dbVal = getDbValue(key);
            const isEditing = key in editValues;
            const isSaving = savingKey === key;
            const currentEditVal = editValues[key] ?? "";
            const error = errorMap[key];
            const updatedAt = getUpdatedAt(key);
            const updatedBy = getUpdatedBy(key);

            return (
              <div
                key={key}
                className="bg-white rounded-2xl border border-pink-100/50 shadow-sm hover:shadow-md transition-all p-6 sm:p-7 flex flex-col gap-5"
              >
                {/* TOP ROW: ICON + TITLE + BADGE */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border flex-shrink-0 ${config.bgIcon}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        {config.label}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        {config.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className="self-start sm:self-auto text-xs font-bold text-pink-600 bg-pink-50 border border-pink-100 px-3 py-1 rounded-full">
                    {config.tag}
                  </span>
                </div>

                {/* MIDDLE ROW: CURRENT VALUE OR EDIT FORM */}
                <div className="bg-[#FFF0F5]/40 rounded-2xl p-5 border border-pink-100/30">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="relative flex-1 w-full">
                          <input
                            type="number"
                            autoFocus
                            value={currentEditVal}
                            onChange={(e) => {
                              setEditValues((prev) => ({ ...prev, [key]: e.target.value }));
                              setErrorMap((prev) => ({ ...prev, [key]: null }));
                            }}
                            className={`w-full text-xl font-extrabold text-gray-800 px-4 py-2.5 rounded-xl border bg-white focus:outline-none ${
                              error
                                ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                                : "border-pink-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                            }`}
                            placeholder="Nhập giá trị mới..."
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                            {config.unit}
                          </span>
                        </div>

                        {/* ACTION BUTTONS IN EDIT MODE */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleSave(key)}
                            disabled={isSaving}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-pink-100 transition-all disabled:opacity-50"
                          >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                          </button>
                          <button
                            onClick={() => handleCancelEdit(key)}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-bold text-sm transition-all"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>

                      {error && (
                        <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                          <AlertTriangle size={14} /> {error}
                        </p>
                      )}

                      {/* PRESET CHIPS */}
                      <div className="flex items-center gap-2 flex-wrap pt-2">
                        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                          <Sparkles size={12} className="text-pink-500" /> Chọn nhanh:
                        </span>
                        {config.presets.map((presetVal) => (
                          <button
                            key={presetVal}
                            type="button"
                            onClick={() => handlePresetClick(key, presetVal)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                              String(currentEditVal) === String(presetVal)
                                ? "bg-pink-500 text-white border-pink-500 shadow-sm"
                                : "bg-white text-gray-700 border-gray-200 hover:border-pink-300 hover:text-pink-600"
                            }`}
                          >
                            {config.unit === "₫"
                              ? Number(presetVal).toLocaleString("vi-VN") + " ₫"
                              : `${presetVal} ngày`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                          Giá trị đang áp dụng
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className={`text-3xl sm:text-4xl font-black tracking-tight ${config.color}`}>
                            {dbVal !== null ? config.format(dbVal) : (
                              <span className="text-xl text-gray-400 font-bold italic">
                                {config.format(key === "TouristAccess.PriceVnd" ? 10000 : 7)} (Mặc định)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartEdit(key)}
                        className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 text-pink-600 font-bold text-sm transition-all shadow-sm active:scale-95"
                      >
                        <Pencil size={16} /> Thay Đổi Giá Trị
                      </button>
                    </div>
                  )}
                </div>

                {/* BOTTOM FOOTER: AUDIT INFO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-400 pt-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>Tự động đồng bộ tức thì sang Mobile App & Hệ thống thanh toán</span>
                  </div>
                  {updatedAt && (
                    <div className="flex items-center gap-1">
                      <Calendar size={13} />
                      <span>Cập nhật lần cuối: {new Date(updatedAt).toLocaleString("vi-VN")}</span>
                      {updatedBy && <span className="text-gray-500 font-medium">bởi {updatedBy}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
