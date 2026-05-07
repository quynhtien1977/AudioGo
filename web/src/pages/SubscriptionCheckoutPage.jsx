import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import toast from "react-hot-toast";

export default function SubscriptionCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { createSubscription, upgradeSubscription, currentSubscription, loading } = useSubscription();

  const [step, setStep] = useState(1); // 1: Plan selection, 2: Payment method, 3: Confirmation
  const [selectedPlan, setSelectedPlan] = useState(location.state?.selectedPlan || null);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!selectedPlan && !location.state?.selectedPlan) {
      navigate("/dashboard");
    }
  }, []);

  const handleConfirmOrder = async () => {
    if (!termsAccepted) {
      toast.error("Vui lòng chấp nhận điều khoản");
      return;
    }

    try {
      setProcessing(true);
      if (currentSubscription) {
        await upgradeSubscription(selectedPlan.id);
        toast.success("Nâng cấp gói thành công");
      } else {
        await createSubscription(selectedPlan.id);
        toast.success("Tạo gói thanh toán thành công");
      }
      setStep(3);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      toast.error("Lỗi: " + err.message);
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (!selectedPlan) {
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-6"
      >
        <ArrowLeft size={18} />
        Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Steps Indicator */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${
                  s <= step ? "bg-pink-600" : "bg-gray-200"
                }`}
              ></div>
            ))}
          </div>

          {/* Step 1: Plan Selection */}
          {step === 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">1. Chọn Gói</h2>
              <div className="space-y-4">
                <div className="border-2 border-pink-600 rounded-lg p-4 bg-pink-50">
                  <h3 className="text-lg font-bold text-gray-900">{selectedPlan.name}</h3>
                  <p className="text-2xl font-bold text-pink-600 mt-2">
                    {selectedPlan.pricePerMonth?.toLocaleString("vi-VN")} ₫/tháng
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-700">
                    <li>✓ Tối đa {selectedPlan.maxPoiCount} POIs</li>
                    <li>✓ {selectedPlan.storageInGb} GB lưu trữ</li>
                    <li>✓ Ưu tiên {selectedPlan.priorityLevel}</li>
                    <li>✓ Hỗ trợ {selectedPlan.supportLevel}</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="mt-6 w-full bg-pink-600 text-white py-2 rounded-lg font-semibold hover:bg-pink-700"
              >
                Tiếp Tục
              </button>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {step === 2 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">2. Phương Thức Thanh Toán</h2>
              <div className="space-y-3">
                {[
                  { id: "credit_card", label: "Thẻ Tín Dụng / Debit" },
                  { id: "bank_transfer", label: "Chuyển Khoản Ngân Hàng" },
                  { id: "wallet", label: "Ví Điện Tử" },
                  { id: "e_invoice", label: "Hóa Đơn Điện Tử" },
                ].map((method) => (
                  <label key={method.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="ml-3 text-gray-700">{method.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Quay Lại
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-pink-600 text-white py-2 rounded-lg font-semibold hover:bg-pink-700"
                >
                  Tiếp Tục
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && !processing && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">3. Xác Nhận Đơn Hàng</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Gói</span>
                  <span className="font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Phương Thức</span>
                  <span className="font-semibold">
                    {["credit_card", "bank_transfer", "wallet", "e_invoice"].find(
                      (m) => m === paymentMethod
                    ) === "credit_card"
                      ? "Thẻ Tín Dụng"
                      : paymentMethod === "bank_transfer"
                      ? "Chuyển Khoản"
                      : paymentMethod === "wallet"
                      ? "Ví Điện Tử"
                      : "Hóa Đơn"}
                  </span>
                </div>
              </div>

              <label className="flex items-start gap-3 mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 mt-1"
                />
                <span className="text-sm text-gray-700">
                  Tôi đã đọc và đồng ý với{" "}
                  <a href="#" className="text-pink-600 font-semibold">
                    Điều khoản sử dụng
                  </a>{" "}
                  và{" "}
                  <a href="#" className="text-pink-600 font-semibold">
                    Chính sách bảo mật
                  </a>
                </span>
              </label>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Quay Lại
                </button>
                <button
                  onClick={handleConfirmOrder}
                  disabled={processing}
                  className="flex-1 bg-pink-600 text-white py-2 rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50"
                >
                  {processing ? "Đang Xử Lý..." : "Xác Nhận & Thanh Toán"}
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {step === 3 && !processing && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Thanh Toán Thành Công!</h3>
              <p className="text-gray-600 mb-6">
                Gói của bạn đã được kích hoạt. Đang chuyển hướng...
              </p>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-bold mb-4">Tóm Tắt Đơn Hàng</h3>

            <div className="space-y-3 mb-6 pb-6 border-b">
              <div className="flex justify-between text-gray-600">
                <span>{selectedPlan.name}</span>
                <span className="font-semibold">
                  {selectedPlan.pricePerMonth?.toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Thời hạn</span>
                <span className="font-semibold">1 tháng</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Tổng Cộng</span>
              <span className="text-pink-600">
                {selectedPlan.pricePerMonth?.toLocaleString("vi-VN")} ₫
              </span>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50"
            >
              Thay Đổi Gói
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
