import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle, Clock3, Layers3, Sparkles, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { useSubscription } from "@/context/SubscriptionContext";

export default function SubscriptionCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { upgradeSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState(location.state?.selectedPlan || null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentInit, setPaymentInit] = useState(null);
  const [qrLoadFailed, setQrLoadFailed] = useState(false);

  useEffect(() => {
    if (!selectedPlan && !location.state?.selectedPlan) {
      navigate("/dashboard");
    }
  }, []);

  const handleConfirm = async () => {
    if (!termsAccepted) {
      toast.error("Vui lòng chấp nhận điều khoản");
      return;
    }

    try {
      setProcessing(true);
      const result = await upgradeSubscription(selectedPlan.id || selectedPlan.planId || selectedPlan.PlanId);
      setPaymentInit(result);
      setQrLoadFailed(false);
      toast.success("Đã tạo giao dịch thanh toán. Vui lòng quét mã QR.");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Không tạo được giao dịch thanh toán";
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  if (!selectedPlan) {
    return null;
  }

  const planName = selectedPlan.displayName || selectedPlan.name || "Gói đăng ký";
  const amount = Number(selectedPlan.price || selectedPlan.pricePerMonth || 0);
  const durationDay = Number(selectedPlan.durationDay || selectedPlan.billingCycleInDays || 30);
  const maxPoi = Number(selectedPlan.maxPoiCount ?? selectedPlan.MaxPoiCount ?? 0);
  const autoPriority = Number(selectedPlan.autoPriority ?? selectedPlan.AutoPriority ?? 1);

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
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Xác nhận gói nâng cấp</h2>
              <p className="text-sm text-gray-500">
                Thanh toán qua SePay QR. Hệ thống đang bật chế độ test amount để bạn thử mà không cần chuyển khoản số lớn.
              </p>
            </div>

            <div className="border rounded-xl p-5 bg-pink-50 border-pink-100">
              <h3 className="text-xl font-bold text-gray-900">{planName}</h3>
              <p className="text-2xl font-black text-pink-600 mt-2">
                {amount.toLocaleString("vi-VN")} ₫
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-white p-3 border border-pink-100">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock3 size={14} />
                    Thời hạn
                  </div>
                  <p className="font-semibold text-gray-900 mt-1">{durationDay} ngày</p>
                </div>
                <div className="rounded-lg bg-white p-3 border border-pink-100">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Layers3 size={14} />
                    POI tối đa
                  </div>
                  <p className="font-semibold text-gray-900 mt-1">{maxPoi}</p>
                </div>
                <div className="rounded-lg bg-white p-3 border border-pink-100">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Sparkles size={14} />
                    Mức ưu tiên
                  </div>
                  <p className="font-semibold text-gray-900 mt-1">{autoPriority}</p>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 mt-1"
              />
              <span className="text-sm text-gray-700">
                Tôi xác nhận thông tin gói ở trên là chính xác và đồng ý tiếp tục đến bước thanh toán QR.
              </span>
            </label>

            <div className="flex gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50"
              >
                Quay lại
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing}
                className="flex-1 bg-pink-600 text-white py-2 rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-60"
              >
                {processing ? "Đang tạo giao dịch..." : "Tạo mã QR thanh toán"}
              </button>
            </div>
          </div>

          {paymentInit && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={20} className="text-green-600" />
                <h3 className="text-xl font-bold text-gray-900">Mã QR thanh toán</h3>
              </div>
              {paymentInit.isTestAmount && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  Đang dùng số tiền test: {Number(paymentInit.amount || 0).toLocaleString("vi-VN")} ₫
                  {" "} (giá gói gốc: {Number(paymentInit.originalPlanAmount || 0).toLocaleString("vi-VN")} ₫)
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="flex justify-center">
                  {paymentInit.vietQrUrl ? (
                    <img
                      src={paymentInit.vietQrUrl}
                      alt="QR thanh toán subscription"
                      onError={() => setQrLoadFailed(true)}
                      className="w-64 h-64 object-contain border rounded-lg p-2 bg-white"
                    />
                  ) : (
                    <div className="text-sm text-gray-500">Không có QR URL</div>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {qrLoadFailed && (
                    <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      Ảnh QR tải lỗi. Bạn có thể mở trực tiếp link QR:
                      {" "}
                      <a
                        href={paymentInit.vietQrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        Mở QR
                      </a>
                    </p>
                  )}
                  <p><span className="text-gray-500">Transaction:</span> <span className="font-mono">{paymentInit.transactionId}</span></p>
                  <p><span className="text-gray-500">Ngân hàng:</span> {paymentInit.bankName || "-"}</p>
                  <p><span className="text-gray-500">Số TK:</span> <span className="font-semibold">{paymentInit.bankAccount || "-"}</span></p>
                  <p><span className="text-gray-500">Số tiền:</span> <span className="font-semibold">{Number(paymentInit.amount || 0).toLocaleString("vi-VN")} ₫</span></p>
                  <div className="flex items-center gap-2">
                    <p><span className="text-gray-500">Nội dung CK:</span> <span className="font-semibold">{paymentInit.transferContent || "-"}</span></p>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(paymentInit.transferContent || "");
                        toast.success("Đã copy nội dung chuyển khoản");
                      }}
                      className="p-1 rounded hover:bg-gray-100"
                      title="Copy nội dung"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-bold mb-4">Tóm Tắt Đơn Hàng</h3>

            <div className="space-y-3 mb-6 pb-6 border-b">
              <div className="flex justify-between text-gray-600">
                <span>{planName}</span>
                <span className="font-semibold">
                  {amount.toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Thời hạn</span>
                <span className="font-semibold">{durationDay} ngày</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Tổng Cộng</span>
              <span className="text-pink-600">
                {amount.toLocaleString("vi-VN")} ₫
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
