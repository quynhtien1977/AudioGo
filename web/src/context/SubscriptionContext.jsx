import { createContext, useContext, useEffect, useState } from "react";
import * as subscriptionApi from "@/api/subscriptionApi";
import useAuth from "@/hooks/useAuth";

const SubscriptionContext = createContext();

const normalizePlan = (plan) => {
  if (!plan) return null;

  const id = plan.id || plan.planId || plan.PlanId || null;

  return {
    ...plan,
    id,
    planId: plan.planId || plan.PlanId || plan.id || null,
    PlanId: plan.PlanId || plan.planId || plan.id || null,
    name: plan.name || plan.Name || "",
    Name: plan.Name || plan.name || "",
    price: Number(plan.price || plan.Price || plan.pricePerMonth || 0),
    pricePerMonth: Number(plan.pricePerMonth || plan.price || plan.Price || 0),
    Price: Number(plan.Price || plan.price || plan.pricePerMonth || 0),
    billingCycleInDays: Number(
      plan.billingCycleInDays || plan.durationDay || plan.DurationDay || 30,
    ),
    durationDay: Number(
      plan.durationDay || plan.DurationDay || plan.billingCycleInDays || 30,
    ),
    DurationDay: Number(
      plan.DurationDay || plan.durationDay || plan.billingCycleInDays || 30,
    ),
    maxPoiCount: Number(plan.maxPoiCount ?? plan.MaxPoiCount ?? -1),
    MaxPoiCount: Number(plan.MaxPoiCount ?? plan.maxPoiCount ?? -1),
    priorityLevel: Number(plan.priorityLevel ?? plan.AutoPriority ?? 1),
    AutoPriority: Number(plan.AutoPriority ?? plan.priorityLevel ?? 1),
    features: plan.features || plan.Features || "[]",
    Features: plan.Features || plan.features || "[]",
  };
};

const normalizePlans = (plans) =>
  Array.isArray(plans) ? plans.map(normalizePlan).filter(Boolean) : [];

const normalizeCurrentSubscription = (data) => {
  if (!data) return null;

  if (data.currentPlan || data.activeSubscription) {
    const currentPlan = normalizePlan(data.currentPlan);
    const activeSubscription = data.activeSubscription || null;

    // Extract planName with multiple fallbacks
    const planName = 
      currentPlan?.name ||
      currentPlan?.Name ||
      data.planName ||
      data.name ||
      data.Name ||
      data.subscriptionPlanName ||
      data.planTitle ||
      null;


    return {
      ...data,
      currentPlan,
      activeSubscription,
      subscriptionPlanId: currentPlan?.id || null,
      planId: currentPlan?.id || null,
      PlanId: currentPlan?.id || null,
      planName,
      pricePerMonth: currentPlan?.pricePerMonth || 0,
      maxPoiCount: currentPlan?.maxPoiCount ?? null,
      priorityLevel: currentPlan?.priorityLevel ?? null,
      status: activeSubscription?.Status || activeSubscription?.status || "ACTIVE",
      startDate: activeSubscription?.StartDate || activeSubscription?.startDate || null,
      expiryDate: activeSubscription?.EndDate || activeSubscription?.endDate || null,
      autoRenew: activeSubscription?.AutoRenew ?? activeSubscription?.autoRenew ?? false,
      daysRemaining:
        activeSubscription?.daysRemaining ??
        activeSubscription?.DaysRemaining ??
        null,
    };
  }

  return {
    ...data,
    subscriptionPlanId:
      data.subscriptionPlanId || data.planId || data.PlanId || data.currentPlan?.id || null,
    planName: data.planName || data.name || data.Name || data.subscriptionPlanName || data.planTitle || null,
  };
};

const mergeCurrentPlanIntoPlans = (
  plans,
) => normalizePlans(plans);

const getReadableError = (error) =>
  error?.response?.data?.message || error?.message || "Unknown subscription error";

export function SubscriptionProvider({ children }) {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setPlans([]);
        setCurrentSubscription(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);

      const promises = [subscriptionApi.getSubscriptionPlansApi()];
      if (user?.role === "Owner") {
        promises.push(subscriptionApi.getMySubscriptionApi());
      } else {
        promises.push(Promise.resolve(null));
      }

      const [plansResult, subscriptionResult] = await Promise.allSettled(promises);

      const nextSubscription =
        subscriptionResult.status === "fulfilled" && subscriptionResult.value
          ? normalizeCurrentSubscription(subscriptionResult.value)
          : null;

      const nextPlans =
        plansResult.status === "fulfilled"
          ? mergeCurrentPlanIntoPlans(plansResult.value, nextSubscription)
          : mergeCurrentPlanIntoPlans([], nextSubscription);

      setPlans(nextPlans);
      setCurrentSubscription(nextSubscription);

      if (plansResult.status === "rejected" && (user?.role === "Owner" && subscriptionResult.status === "rejected")) {
        setError(
          `${getReadableError(plansResult.reason)} | ${getReadableError(
            subscriptionResult.reason,
          )}`,
        );
      } else if (plansResult.status === "rejected") {
        setError(getReadableError(plansResult.reason));
      } else if (subscriptionResult.status === "rejected") {
        setError(getReadableError(subscriptionResult.reason));
      } else {
        setError(null);
      }

      setLoading(false);
    };

    fetchData();
  }, [user?.role]);

  const fetchPlans = async () => {
    try {
      const data = await subscriptionApi.getSubscriptionPlansApi();
      const normalized = mergeCurrentPlanIntoPlans(data, currentSubscription);
      setPlans(normalized);
      setError(null);
      return normalized;
    } catch (err) {
      console.error("Error fetching plans:", err);
      setError(getReadableError(err));
      throw err;
    }
  };

  const fetchMySubscription = async () => {
    if (user?.role !== "Owner") return null;
    try {
      const data = await subscriptionApi.getMySubscriptionApi();
      const normalized = normalizeCurrentSubscription(data);
      setCurrentSubscription(normalized);
      setPlans((prevPlans) => mergeCurrentPlanIntoPlans(prevPlans, normalized));
      setError(null);
      return normalized;
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError(getReadableError(err));
      throw err;
    }
  };

  const createSubscription = async (planId) => {
    try {
      setLoading(true);
      const result = await subscriptionApi.initUpgradeSubscriptionApi(planId, "SEPAY");
      return result;
    } catch (err) {
      console.error("Error creating subscription:", err);
      setError(getReadableError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const upgradeSubscription = async (newPlanId, gateway = "SEPAY") => {
    try {
      setLoading(true);
      const result = await subscriptionApi.initUpgradeSubscriptionApi(newPlanId, gateway);
      return result;
    } catch (err) {
      console.error("Error upgrading subscription:", err);
      setError(getReadableError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Alias: dùng để refresh sau khi thanh toán thành công
  const refreshSubscription = fetchMySubscription;

  const value = {
    plans,
    currentSubscription,
    loading,
    error,
    fetchPlans,
    fetchMySubscription,
    refreshSubscription,
    createSubscription,
    upgradeSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
}
