import { useState, useEffect } from "react";
import { Check, AlertCircle } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PageLoader from "@/components/PageLoader";

export default function PricingPlansPage() {
  const navigate = useNavigate();
  const { plans, currentSubscription, loading, error, fetchPlans } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  if (loading) {
    return <PageLoader text="Đang tải gói cước..." />;
  }

  const handleSelectPlan = (plan) => {
    if (currentSubscription?.subscriptionPlanId === plan.id) {
      toast.info("Bạn đang sử dụng gói này");
      return;
    }
    navigate("/subscription/checkout", { state: { selectedPlan: plan } });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gói Thanh Toán</h1>
        <p className="text-gray-600">
          Chọn gói phù hợp với nhu cầu của bạn
        </p>
      </div>

      {currentSubscription && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Gói Hiện Tại</h3>
            <p className="text-sm text-blue-800">
              Bạn đang sử dụng: <strong>{currentSubscription.planName}</strong>
              {currentSubscription.expiryDate && (
                <> - Hết hạn: {new Date(currentSubscription.expiryDate).toLocaleDateString("vi-VN")}</>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentSubscription?.subscriptionPlanId === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-lg border-2 p-6 transition-all ${
                isCurrent
                  ? "border-pink-500 bg-pink-50 shadow-lg"
                  : "border-gray-200 bg-white hover:border-pink-300 hover:shadow-md"
              }`}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-3xl font-bold text-pink-600 mb-4">
                {plan.pricePerMonth?.toLocaleString("vi-VN")} ₫<span className="text-sm text-gray-600">/tháng</span>
              </p>

              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Tối đa <strong>{plan.maxPoiCount}</strong> POIs
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    <strong>{plan.storageInGb}</strong> GB lưu trữ
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Ưu tiên <strong>{plan.priorityLevel}</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Hỗ trợ <strong>{plan.supportLevel}</strong>
                  </span>
                </li>
              </ul>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrent}
                className={`w-full py-2 rounded-lg font-semibold transition-all ${
                  isCurrent
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-pink-600 text-white hover:bg-pink-700"
                }`}
              >
                {isCurrent ? "Gói Hiện Tại" : "Chọn Gói"}
              </button>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}
