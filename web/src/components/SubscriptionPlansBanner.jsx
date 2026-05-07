import { useEffect, useState } from "react";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import { useSubscription } from "@/context/SubscriptionContext";

const SHARED_THEME = {
  icon: Sparkles,

  iconWrapClass: "bg-[#FFF0F5]",

  iconClass: "text-[#EE4B8E]",

  cardClass:
    "border border-white/70 shadow-[0_8px_24px_rgba(148,163,184,0.10)]",

  currentCardClass:
    "border-2 border-pink-200 shadow-[0_12px_30px_rgba(238,75,142,0.12)]",

  buttonClass:
    "bg-[#EE4B8E] text-white shadow-[0_8px_20px_rgba(238,75,142,0.22)] hover:bg-[#D63A79]",
};

const PLANS_PER_VIEW = 3;

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
        : word,
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
  const rawFeatures = parseFeatures(
    plan.features || plan.Features,
  );

  return {
    ...plan,

    id:
      plan.id ||
      plan.planId ||
      plan.PlanId,

    planId:
      plan.planId ||
      plan.PlanId ||
      plan.id,

    PlanId:
      plan.PlanId ||
      plan.planId ||
      plan.id,

    name:
      plan.name ||
      plan.Name ||
      "",

    displayName: titleCaseVi(
      plan.name || plan.Name || "",
    ),

    pricePerMonth: Number(
      plan.pricePerMonth ||
        plan.price ||
        plan.Price ||
        0,
    ),

    price: Number(
      plan.price ||
        plan.Price ||
        plan.pricePerMonth ||
        0,
    ),

    autoPriority: Number(
      plan.autoPriority ??
        plan.AutoPriority ??
        999,
    ),

    maxPoiCount: Number(
      plan.maxPoiCount ??
        plan.MaxPoiCount ??
        0,
    ),

    features: rawFeatures
      .map((feature) =>
        titleCaseVi(
          String(feature).replace(
            /[_-]/g,
            " ",
          ),
        ),
      )
      .filter(Boolean)
      .filter(
        (feature) =>
          !/^\d+\s*điểm tham quan$/i.test(
            feature,
          ),
      ),
  };
};

const getCurrentPlanId = (subscription) =>
  subscription?.subscriptionPlanId ||
  subscription?.planId ||
  subscription?.PlanId ||
  subscription?.currentPlan?.PlanId ||
  subscription?.currentPlan?.planId ||
  null;

export default function SubscriptionPlansBanner({
  isOpen,
  onClose,
}) {
  const navigate = useNavigate();

  const [startIndex, setStartIndex] =
    useState(0);

  const [direction, setDirection] =
    useState(1);

  const {
    plans,
    currentSubscription,
    loading,
    fetchPlans,
  } = useSubscription();

  useEffect(() => {
    if (isOpen && !plans.length) {
      fetchPlans();
    }
  }, [fetchPlans, isOpen, plans.length]);

  if (!isOpen) return null;

  const currentPlanId =
    getCurrentPlanId(currentSubscription);

  const normalizedPlans = [...plans]
    .map(normalizePlan)
    .sort(
      (a, b) =>
        a.autoPriority -
          b.autoPriority ||
        a.displayName.localeCompare(
          b.displayName,
        ),
    );

  const visiblePlans =
    normalizedPlans.slice(
      startIndex,
      startIndex + PLANS_PER_VIEW,
    );

  const canGoPrev =
    startIndex > 0;

  const canGoNext =
    startIndex +
      PLANS_PER_VIEW <
    normalizedPlans.length;

  const handlePrev = () => {
    if (!canGoPrev) return;

    setDirection(-1);

    setStartIndex(
      (prev) => prev - 1,
    );
  };

  const handleNext = () => {
    if (!canGoNext) return;

    setDirection(1);

    setStartIndex(
      (prev) => prev + 1,
    );
  };

  const handleSelectPlan = (plan) => {
    if (
      currentPlanId &&
      currentPlanId === plan.id
    ) {
      toast.info("Bạn đang sử dụng gói này");

      onClose();

      return;
    }

    onClose();

    navigate("/subscription/checkout", {
      state: {
        selectedPlan: plan,
      },
    });
  };

  const Icon = SHARED_THEME.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-3 backdrop-blur-sm md:p-5">
      <div className="relative mx-auto max-w-5xl rounded-[1.4rem] bg-[#FDF8FA] px-4 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.16)] md:px-6 md:py-6">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-white/80 p-1.5 text-gray-500 shadow-sm transition hover:bg-white hover:text-gray-700"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-black tracking-tight text-[#252b31] md:text-4xl">
            Chọn Gói Phù Hợp
          </h1>

          <p className="mt-2 text-xs text-[#8E707E] md:text-base">
            Nâng cấp trải nghiệm địa điểm với các tính năng cao cấp dành cho quản lý nhà hàng.
          </p>
        </div>

        <div className="mt-6 md:mt-8">
          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#EE4B8E]" />
            </div>
          ) : visiblePlans.length > 0 ? (
            <div className="relative overflow-hidden">
              <AnimatePresence
                mode="wait"
                custom={direction}
              >
                <motion.div
                  key={startIndex}
                  custom={direction}
                  initial={{
                    opacity: 0,
                    x:
                      direction > 0
                        ? 120
                        : -120,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x:
                      direction > 0
                        ? -120
                        : 120,
                  }}
                  transition={{
                    duration: 0.35,
                    ease: "easeInOut",
                  }}
                  className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5"
                >
                  {visiblePlans.map(
                    (plan, index) => {
                      const isCurrentPlan =
                        currentPlanId &&
                        currentPlanId ===
                          plan.id;

                      return (
                        <motion.div
                          key={plan.id}
                          initial={{
                            opacity: 0,
                            y: 20,
                            scale: 0.96,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                          }}
                          transition={{
                            duration: 0.25,
                            delay:
                              index * 0.08,
                          }}
                          className={`relative flex min-h-[340px] flex-col rounded-[1.3rem] bg-white p-4 transition-all duration-300 md:p-5 ${
                            isCurrentPlan
                              ? SHARED_THEME.currentCardClass
                              : SHARED_THEME.cardClass
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${SHARED_THEME.iconWrapClass}`}
                          >
                            <Icon
                              size={18}
                              className={
                                SHARED_THEME.iconClass
                              }
                            />
                          </div>

                          <div className="mt-4">
                            <h3 className="text-[1.3rem] font-black leading-none text-[#252b31]">
                              {
                                plan.displayName
                              }
                            </h3>

                            <div className="mt-2 flex items-end gap-2 text-[#252b31]">
                              <span className="text-2xl font-black leading-none md:text-3xl">
                                {formatPrice(
                                  plan.pricePerMonth,
                                )}
                              </span>

                              <span className="pb-1 text-xs font-semibold text-[#776e75]">
                                VNĐ/tháng
                              </span>
                            </div>
                          </div>

                          <div className="mt-5 space-y-2.5">
                            {plan.features
                              .length > 0 ? (
                              plan.features.map(
                                (
                                  feature,
                                ) => (
                                  <div
                                    key={
                                      feature
                                    }
                                    className="flex items-start gap-2.5"
                                  >
                                    <Check
                                      size={
                                        14
                                      }
                                      className="mt-1 shrink-0 rounded-full border border-[#4fa44d] p-[1px] text-[#4fa44d]"
                                    />

                                    <span className="text-[13px] font-semibold leading-5 text-[#5d555c]">
                                      {
                                        feature
                                      }
                                    </span>
                                  </div>
                                ),
                              )
                            ) : (
                              <div className="flex items-start gap-2.5">
                                <Check
                                  size={
                                    14
                                  }
                                  className="mt-1 shrink-0 rounded-full border border-[#4fa44d] p-[1px] text-[#4fa44d]"
                                />

                                <span className="text-[13px] font-semibold leading-5 text-[#5d555c]">
                                  Gói đã sẵn sàng để sử dụng
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-auto pt-5">
                            {isCurrentPlan ? (
                              <button
                                disabled
                                className="w-full rounded-full bg-gray-200 px-4 py-2.5 text-xs font-bold text-gray-500"
                              >
                                Gói Hiện Tại
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleSelectPlan(
                                    plan,
                                  )
                                }
                                className={`w-full rounded-full px-4 py-2.5 text-xs font-bold transition ${SHARED_THEME.buttonClass}`}
                              >
                                Chọn gói này
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    },
                  )}
                </motion.div>
              </AnimatePresence>

              {normalizedPlans.length >
                PLANS_PER_VIEW && (
                <>
                  <button
                    disabled={!canGoPrev}
                    onClick={handlePrev}
                    className="absolute -left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={18}
                    />
                  </button>

                  <button
                    disabled={!canGoNext}
                    onClick={handleNext}
                    className="absolute -right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight
                      size={18}
                    />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-[1.3rem] bg-white px-5 py-10 text-center shadow-sm">
              <p className="text-sm font-semibold text-gray-700">
                Hiện chưa có gói đăng ký khả dụng.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}