import { useEffect, useState } from "react";
import {
  Check,
  Sparkles,
  X,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSubscription } from "@/context/SubscriptionContext";
import useAuth from "@/hooks/useAuth";

const formatPrice = (value) => {
  const amount = Number(value || 0);
  return amount.toLocaleString("vi-VN");
};

const titleCaseVi = (text = "") => {
  const normalized = String(text)
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("vi-VN");

  return normalized
    .split(" ")
    .map((word) =>
      word
        ? word.charAt(0).toLocaleUpperCase("vi-VN") + word.slice(1)
        : word
    )
    .join(" ")
    .replace(/\bPoi\b/g, "POI")
    .replace(/\bVnđ\b/g, "VNĐ")
    .replace(/\bVip\b/g, "VIP");
};

const parseFeatures = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const normalizePlan = (plan) => {
  const rawFeatures = parseFeatures(plan.features || plan.Features);

  return {
    ...plan,
    id: plan.id || plan.planId || plan.PlanId,
    planId: plan.planId || plan.PlanId || plan.id,
    PlanId: plan.PlanId || plan.planId || plan.id,
    name: plan.name || plan.Name || "",
    displayName: titleCaseVi(plan.name || plan.Name || ""),
    pricePerMonth: Number(
      plan.pricePerMonth || plan.price || plan.Price || 0
    ),
    price: Number(
      plan.price || plan.Price || plan.pricePerMonth || 0
    ),
    autoPriority: Number(
      plan.autoPriority ?? plan.AutoPriority ?? 999
    ),
    maxPoiCount: Number(
      plan.maxPoiCount ?? plan.MaxPoiCount ?? 0
    ),
    durationDay: Number(
      plan.durationDay || plan.DurationDay || plan.billingCycleInDays || 30
    ),
    features: rawFeatures
      .map((feature) =>
        titleCaseVi(String(feature).replace(/[_-]/g, " "))
      )
      .filter(Boolean),
  };
};

const getCurrentPlanId = (subscription) =>
  subscription?.subscriptionPlanId ||
  subscription?.planId ||
  subscription?.PlanId ||
  subscription?.currentPlan?.PlanId ||
  subscription?.currentPlan?.planId ||
  subscription?.currentPlan?.id ||
  null;

export default function SubscriptionPlansBanner({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fetching, setFetching] = useState(false);

  const {
    plans,
    currentSubscription,
    loading,
    fetchPlans,
    fetchMySubscription,
  } = useSubscription();

  // Fresh refetch mỗi khi mở banner để tránh stale cache sau login / upgrade
  useEffect(() => {
    if (isOpen) {
      const loadFresh = async () => {
        setFetching(true);
        try {
          await Promise.allSettled([
            fetchPlans(),
            user?.role === "Owner" ? fetchMySubscription?.() : Promise.resolve(),
          ]);
        } finally {
          setFetching(false);
        }
      };
      loadFresh();
    }
  }, [isOpen, user?.role]);

  if (!isOpen) return null;

  const currentPlanId = getCurrentPlanId(currentSubscription);

  const normalizedPlans = [...plans]
    .map(normalizePlan)
    .sort(
      (a, b) =>
        a.autoPriority - b.autoPriority ||
        a.displayName.localeCompare(b.displayName)
    );

  // Kiểm tra gói hiện tại có còn trong danh sách active hay không
  const isCurrentPlanActive = currentPlanId
    ? normalizedPlans.some((p) => p.id === currentPlanId || p.planId === currentPlanId)
    : false;

  const handleSelectPlan = (plan) => {
    if (currentPlanId && (currentPlanId === plan.id || currentPlanId === plan.planId)) {
      toast.info("Bạn đang sử dụng gói này");
      onClose();
      return;
    }

    onClose();
    navigate("/admin/subscription/checkout", {
      state: {
        selectedPlan: plan,
      },
    });
  };

  const isDataLoading = loading || fetching;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-[2rem] bg-[#FDF8FA] p-6 md:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.25)] border border-pink-100 overflow-hidden">
        
        {/* NÚT ĐÓNG */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-20 rounded-full bg-white/90 p-2 text-gray-400 shadow-sm transition-all hover:bg-pink-50 hover:text-pink-600 hover:scale-105"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        {/* HEADER */}
        <div className="mx-auto max-w-2xl text-center mb-6 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Zap size={14} /> Gói Nâng Cấp Dịch Vụ
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
            Chọn Gói Phù Hợp Cho Địa Điểm Của Bạn
          </h1>
          <p className="mt-1.5 text-xs text-[#8E707E] md:text-sm">
            Gia tăng lượt nghe audio thuyết minh, tiếp cận hàng nghìn du khách mỗi ngày.
          </p>
        </div>

        {/* CẢNH BÁO / THÔNG BÁO GÓI ĐANG DÙNG */}
        {!isDataLoading && currentSubscription && currentPlanId && (
          <div className="shrink-0">
            {!isCurrentPlanActive ? (
              /* CẢNH BÁO GÓI BỊ ẨN / NGỪNG CUNG CẤP */
              <div className="mb-6 flex items-start gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-amber-900 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <AlertTriangle size={20} />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-amber-900">
                    Gói đang sử dụng ({currentSubscription.planName || "Gói cũ"}) hiện đã bị ẩn hoặc ngừng cung cấp
                  </h4>
                  <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                    Gói dịch vụ này đã được quản trị viên ẩn hoặc thay đổi. Bạn vẫn tiếp tục được bảo lưu quyền lợi và sử dụng đến hết hạn
                    {currentSubscription.expiryDate ? ` (${new Date(currentSubscription.expiryDate).toLocaleDateString("vi-VN")})` : ""}.
                    Vui lòng chọn một trong các gói đang hoạt động bên dưới nếu muốn chuyển đổi hoặc nâng cấp.
                  </p>
                </div>
              </div>
            ) : (
              /* THÔNG TIN GÓI HIỆN TẠI ĐANG ACTIVE */
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50/90 to-purple-50/60 p-4 text-pink-900 shadow-sm">
                <div className="flex items-center gap-3 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-pink-500">Gói đang sử dụng</p>
                    <h4 className="text-sm font-extrabold text-gray-900">
                      {currentSubscription.planName}
                    </h4>
                  </div>
                </div>
                <div>
                  {currentSubscription.expiryDate ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-700">
                      Hạn dùng: {new Date(currentSubscription.expiryDate).toLocaleDateString("vi-VN")}
                      {currentSubscription.daysRemaining != null && ` (Còn ${currentSubscription.daysRemaining} ngày)`}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      Đang hoạt động
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DANH SÁCH GÓI CUỘN NGANG (HORIZONTAL SCROLL) */}
        <div className="flex-1 overflow-y-auto pr-1">
          {isDataLoading ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-pink-500">
              <Loader2 className="animate-spin" size={32} />
              <p className="text-sm font-medium">Đang tải danh sách gói cước mới nhất...</p>
            </div>
          ) : normalizedPlans.length > 0 ? (
            <div>
              <div
                className="flex gap-5 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#F472B6 #FDF2F8",
                }}
              >
                {normalizedPlans.map((plan) => {
                  const isCurrentPlan =
                    currentPlanId &&
                    (currentPlanId === plan.id || currentPlanId === plan.planId);

                  return (
                    <div
                      key={plan.id}
                      className={`w-[290px] md:w-[320px] shrink-0 flex flex-col justify-between rounded-[1.6rem] bg-white p-6 transition-all duration-200 border-2 ${
                        isCurrentPlan
                          ? "border-pink-500 shadow-xl shadow-pink-100/70 ring-2 ring-pink-200"
                          : "border-pink-100/80 hover:border-pink-300 hover:shadow-lg hover:-translate-y-1"
                      }`}
                    >
                      {/* HEADER CARD */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                            <ShieldCheck size={20} />
                          </div>
                          {isCurrentPlan && (
                            <span className="rounded-full bg-pink-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                              ✓ Gói hiện tại
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-black text-gray-900">
                          {plan.displayName}
                        </h3>

                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-pink-600">
                            {formatPrice(plan.pricePerMonth)}
                          </span>
                          <span className="text-xs font-bold text-gray-400">
                            VNĐ / {plan.durationDay ? `${plan.durationDay} ngày` : "tháng"}
                          </span>
                        </div>

                        {/* POI Limit Badge */}
                        <div className="mt-3 inline-block px-2.5 py-1 rounded-lg bg-[#FFF0F5] text-pink-700 text-xs font-bold">
                          {plan.maxPoiCount > 0
                            ? `Tối đa ${plan.maxPoiCount} điểm POI`
                            : "Không giới hạn POI"}
                        </div>

                        {/* FEATURES LIST */}
                        <div className="mt-4 space-y-2 border-t border-pink-50 pt-4">
                          {plan.features.length > 0 ? (
                            plan.features.map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-left">
                                <Check
                                  size={15}
                                  className="mt-0.5 shrink-0 text-emerald-500"
                                />
                                <span className="text-xs font-medium text-gray-600 leading-snug">
                                  {feature}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-start gap-2 text-left">
                              <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                              <span className="text-xs font-medium text-gray-600">
                                Đầy đủ tính năng AudioGuide & Analytics
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CTA BUTTON */}
                      <div className="mt-6 pt-4 border-t border-gray-50">
                        {isCurrentPlan ? (
                          <button
                            disabled
                            className="w-full py-3 rounded-xl bg-pink-50 border border-pink-200 text-pink-600 font-bold text-xs cursor-default flex items-center justify-center gap-1.5"
                          >
                            <Check size={14} /> Gói Đang Hoạt Động
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectPlan(plan)}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-pink-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                          >
                            Chọn gói này →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* HINT SCROLL NẾU CÓ NHIỀU HƠN 3 GÓI */}
              {normalizedPlans.length > 3 && (
                <p className="text-center text-xs font-semibold text-[#8E707E]/70 mt-2">
                  ← Vuốt hoặc cuộn chuột ngang để xem tất cả {normalizedPlans.length} gói →
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-12 text-center border border-pink-100">
              <p className="text-sm font-semibold text-gray-700">
                Hiện chưa có gói đăng ký nào đang kích hoạt trong hệ thống.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}