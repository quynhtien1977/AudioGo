import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, Clock3, Layers3, Sparkles, Copy,
  Loader2, XCircle, AlertTriangle, RefreshCw, ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";
import { useSubscription } from "@/context/SubscriptionContext";
import api from "@/api/apiClient";

// Thời gian poll mỗi lần (ms)
const POLL_INTERVAL_MS = 5_000;
// Đếm ngược + tổng timeout đồng nhất: 10 phút
const QR_EXPIRE_SECS   = 10 * 60;  // 600 giây

// apiClient baseURL đã có /api — đường dẫn bắt đầu từ /cms/...
async function verifyUpgrade(transactionId) {
  const res = await api.get(
    `/cms/subscriptions/upgrade/verify?transactionId=${encodeURIComponent(transactionId)}`
  );
  return res.data;
}

export default function SubscriptionCheckoutPage() {
  const navigate             = useNavigate();
  const location             = useLocation();
  const { upgradeSubscription, refreshSubscription, currentSubscription } = useSubscription();

  const [selectedPlan, setSelectedPlan]   = useState(location.state?.selectedPlan || null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing]       = useState(false);
  const [paymentInit, setPaymentInit]     = useState(null);
  const [qrLoadFailed, setQrLoadFailed]   = useState(false);

  // Modal cảnh báo downgrade
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);

  // Payment polling state: "idle" | "pending" | "success" | "failed" | "expired"
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [verifyResult, setVerifyResult]   = useState(null);

  // Countdown QR expire (detik)
  const [countdown, setCountdown]         = useState(QR_EXPIRE_SECS);

  const pollIntervalRef = useRef(null);
  const countdownRef    = useRef(null);

  // ── Cleanup timers ──────────────────────────────────────────────────────────
  const clearAllTimers = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownRef.current)    clearInterval(countdownRef.current);
    pollIntervalRef.current = null;
    countdownRef.current    = null;
  }, []);

  useEffect(() => {
    if (!selectedPlan && !location.state?.selectedPlan) {
      navigate("/admin/dashboard");
    }
    return () => clearAllTimers();
  }, []);

  // ── Start polling sau khi có transactionId ──────────────────────────────────
  const startPolling = useCallback((transactionId) => {
    setPaymentStatus("pending");
    setCountdown(QR_EXPIRE_SECS);

    // Countdown timer — khi về 0 tự trigger expired (không cần pollTimeoutRef riêng)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          // Trigger expired qua functional update để tránh stale closure
          setPaymentStatus((cur) => {
            if (cur === "pending") {
              // Dừng poll interval
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              toast.error("QR đã hết hạn. Vui lòng tạo mã mới.");
              return "expired";
            }
            return cur;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1_000);

    // Poll verify mỗi 5 giây
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await verifyUpgrade(transactionId);
        if (res.status === "SUCCESS") {
          clearAllTimers();
          setPaymentStatus("success");
          setVerifyResult(res);
          if (refreshSubscription) await refreshSubscription();
          toast.success("Thanh toán thành công! Gói đã được kích hoạt.");
        } else if (res.status === "FAILED") {
          clearAllTimers();
          setPaymentStatus("failed");
          toast.error("Giao dịch thất bại. Vui lòng thử lại.");
        } else if (res.status === "EXPIRED") {
          clearAllTimers();
          setPaymentStatus("expired");
          toast.error("QR đã hết hạn. Vui lòng tạo mã mới.");
        }
      } catch {
        // Bỏ qua lỗi mạng tạm thời — poll vẫn tiếp tục
      }
    }, POLL_INTERVAL_MS);
  }, [clearAllTimers, refreshSubscription]);

  // ── Xử lý confirm thanh toán ────────────────────────────────────────────────
  // Kiểm tra downgrade: so sánh plan đang chọn với plan hiện tại
  const detectDowngrade = () => {
    if (!currentSubscription?.currentPlan || !selectedPlan) return null;
    const cur = currentSubscription.currentPlan;
    const curMaxPoi   = Number(cur.maxPoiCount  ?? cur.MaxPoiCount  ?? -1);
    const curPriority = Number(cur.AutoPriority ?? cur.priorityLevel ?? 1);
    const newMaxPoi   = Number(selectedPlan.maxPoiCount ?? selectedPlan.MaxPoiCount ?? -1);
    const newPriority = Number(selectedPlan.autoPriority ?? selectedPlan.AutoPriority ?? 1);

    const warnings = [];
    if (newPriority < curPriority)
      warnings.push(`Mức ưu tiên hiển thị POI sẽ giảm từ ${curPriority} xuống ${newPriority}.`);
    if (curMaxPoi === -1 && newMaxPoi >= 0)
      warnings.push(`Giới hạn POI sẽ từ không giới hạn xuống tối đa ${newMaxPoi} POI.`);
    else if (newMaxPoi >= 0 && curMaxPoi >= 0 && newMaxPoi < curMaxPoi)
      warnings.push(`Giới hạn POI sẽ giảm từ ${curMaxPoi} xuống ${newMaxPoi} POI.`);

    if (warnings.length === 0) return null;

    return { warnings, newMaxPoi, curMaxPoi, curPriority, newPriority };
  };

  const handleConfirm = async () => {
    if (!termsAccepted) {
      toast.error("Vui lòng chấp nhận điều khoản");
      return;
    }
    // Nếu là downgrade → hiển modal cảnh báo trước
    const downgradeInfo = detectDowngrade();
    if (downgradeInfo) {
      setShowDowngradeModal(downgradeInfo);
      return;
    }
    await proceedToPayment();
  };

  const proceedToPayment = async () => {
    try {
      setProcessing(true);
      const planId = selectedPlan.id || selectedPlan.planId || selectedPlan.PlanId;
      // Chỉ dùng SEPAY (MoMo chưa implement)
      const result = await upgradeSubscription(planId, "SEPAY");
      setPaymentInit(result);
      setQrLoadFailed(false);
      toast.success("Đã tạo giao dịch. Vui lòng quét mã QR.");
      startPolling(result.transactionId);
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

  // ── Tạo QR mới (khi expired/failed) ────────────────────────────────────────
  const handleRetry = async () => {
    clearAllTimers();
    setPaymentInit(null);
    setPaymentStatus("idle");
    setVerifyResult(null);
    setQrLoadFailed(false);
    setCountdown(QR_EXPIRE_SECS);
    setTermsAccepted(false);
  };

  if (!selectedPlan) return null;

  const planName    = selectedPlan.displayName || selectedPlan.name || "Gói đăng ký";
  const amount      = Number(selectedPlan.price || selectedPlan.pricePerMonth || 0);
  const durationDay = Number(selectedPlan.durationDay || selectedPlan.billingCycleInDays || 30);
  const maxPoi      = Number(selectedPlan.maxPoiCount ?? selectedPlan.MaxPoiCount ?? 0);
  const autoPriority = Number(selectedPlan.autoPriority ?? selectedPlan.AutoPriority ?? 1);

  // Kiểm tra downgrade (chỉ để hiển thị badge trên UI)
  const downgradeDetected = detectDowngrade();

  // Format countdown
  const countdownMins = String(Math.floor(countdown / 60)).padStart(2, "0");
  const countdownSecs = String(countdown % 60).padStart(2, "0");

  // ── SUCCESS STATE ────────────────────────────────────────────────────────────
  if (paymentStatus === "success") {
    return (
      <div className="p-6 max-w-lg mx-auto mt-16 text-center">
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-10">
          <div className="flex justify-center mb-4">
            <CheckCircle size={56} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h2>
          <p className="text-gray-500 mb-6">
            Gói <span className="font-semibold text-pink-600">{verifyResult?.planName ?? planName}</span> đã được kích hoạt.
          </p>
          {verifyResult?.endDate && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-800">
              <p>Hạn sử dụng đến: <strong>{new Date(verifyResult.endDate).toLocaleDateString("vi-VN")}</strong></p>
              {verifyResult.daysRemaining != null && (
                <p>Còn lại: <strong>{verifyResult.daysRemaining} ngày</strong></p>
              )}
            </div>
          )}
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="w-full bg-pink-600 text-white py-2.5 rounded-xl font-semibold hover:bg-pink-700 transition"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-6"
      >
        <ArrowLeft size={18} />
        Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Gói thông tin */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Xác nhận gói nâng cấp</h2>
              <p className="text-sm text-gray-500">
                Thanh toán qua SePay (VietQR). Hệ thống đang bật chế độ test amount.
              </p>

              {/* Badge cảnh báo downgrade */}
              {downgradeDetected && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
                  <ShieldAlert size={18} className="text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-800 mb-1"> Đây là hạ gói</p>
                    <ul className="list-disc list-inside text-amber-700 space-y-0.5">
                      {downgradeDetected.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                      <li>Bạn có <strong>3 ngày</strong> để tự xử lý POI vượt giới hạn trước khi hệ thống tự ẩn.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="border rounded-xl p-5 bg-pink-50 border-pink-100">
              <h3 className="text-xl font-bold text-gray-900">{planName}</h3>
              <p className="text-2xl font-black text-pink-600 mt-2">
                {amount.toLocaleString("vi-VN")} ₫
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-white p-3 border border-pink-100">
                  <div className="flex items-center gap-2 text-gray-600"><Clock3 size={14} />Thời hạn</div>
                  <p className="font-semibold text-gray-900 mt-1">{durationDay} ngày</p>
                </div>
                <div className="rounded-lg bg-white p-3 border border-pink-100">
                  <div className="flex items-center gap-2 text-gray-600"><Layers3 size={14} />POI tối đa</div>
                  <p className="font-semibold text-gray-900 mt-1">{maxPoi}</p>
                </div>
                <div className="rounded-lg bg-white p-3 border border-pink-100">
                  <div className="flex items-center gap-2 text-gray-600"><Sparkles size={14} />Mức ưu tiên</div>
                  <p className="font-semibold text-gray-900 mt-1">{autoPriority}</p>
                </div>
              </div>
            </div>

            {/* Terms + Buttons — chỉ hiện khi chưa có paymentInit */}
            {!paymentInit && (
              <>
                <label className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer">
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
                    onClick={() => navigate("/admin/dashboard")}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={processing || !termsAccepted}
                    className="flex-1 bg-pink-600 text-white py-2 rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {processing && <Loader2 size={16} className="animate-spin" />}
                    {processing ? "Đang tạo giao dịch..." : "Tạo mã QR thanh toán"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── QR Panel ────────────────────────────────────────────────────── */}
          {paymentInit && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">

              {/* Header + trạng thái */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900">Mã QR thanh toán</h3>
                </div>

                {/* Status badge */}
                {paymentStatus === "pending" && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    <Loader2 size={13} className="animate-spin" />
                    Đang chờ... {countdownMins}:{countdownSecs}
                  </span>
                )}
                {paymentStatus === "failed" && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                    <XCircle size={13} />
                    Thất bại
                  </span>
                )}
                {paymentStatus === "expired" && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                    <AlertTriangle size={13} />
                    Hết hạn
                  </span>
                )}
              </div>

              {/* Test amount badge */}
              {paymentInit.isTestAmount && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  Đang dùng số tiền test:{" "}
                  <strong>{Number(paymentInit.amount || 0).toLocaleString("vi-VN")} ₫</strong>
                  {" "}(giá gốc: {Number(paymentInit.originalPlanAmount || 0).toLocaleString("vi-VN")} ₫)
                </p>
              )}

              {/* QR + thông tin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="flex justify-center relative">
                  {paymentInit.vietQrUrl ? (
                    <>
                      <img
                        src={paymentInit.vietQrUrl}
                        alt="QR thanh toán subscription"
                        onError={() => setQrLoadFailed(true)}
                        className={`w-64 h-64 object-contain border rounded-lg p-2 bg-white transition-opacity
                          ${(paymentStatus === "expired" || paymentStatus === "failed") ? "opacity-30" : ""}`}
                      />
                      {/* Overlay khi expired/failed */}
                      {(paymentStatus === "expired" || paymentStatus === "failed") && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/90 rounded-lg p-3 text-center shadow">
                            <XCircle size={28} className="text-red-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-600 font-medium">
                              {paymentStatus === "expired" ? "QR đã hết hạn" : "Giao dịch thất bại"}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">Không có QR URL</div>
                  )}
                  {qrLoadFailed && (
                    <p className="absolute bottom-0 left-0 right-0 text-center text-xs text-amber-700">
                      <a href={paymentInit.vietQrUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        Mở QR link
                      </a>
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Transaction:</span> <span className="font-mono text-xs">{paymentInit.transactionId}</span></p>
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

              {/* Polling progress bar */}
              {paymentStatus === "pending" && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <Loader2 size={11} className="animate-spin" />
                    <span>Đang kiểm tra thanh toán tự động mỗi 5 giây...</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1">
                    <div
                      className="bg-pink-500 h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${(countdown / QR_EXPIRE_SECS) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Retry button khi failed/expired */}
              {(paymentStatus === "expired" || paymentStatus === "failed") && (
                <div className="mt-4 text-center">
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 bg-pink-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-pink-700 text-sm"
                  >
                    <RefreshCw size={14} />
                    Tạo mã QR mới
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL (Order Summary) ─────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-bold mb-4">Tóm Tắt Đơn Hàng</h3>

            <div className="space-y-3 mb-6 pb-6 border-b">
              <div className="flex justify-between text-gray-600">
                <span>{planName}</span>
                <span className="font-semibold">{amount.toLocaleString("vi-VN")} ₫</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Thời hạn</span>
                <span className="font-semibold">{durationDay} ngày</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Tổng Cộng</span>
              <span className="text-pink-600">{amount.toLocaleString("vi-VN")} ₫</span>
            </div>

            {/* Gateway badge — chỉ SEPAY */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <span className="bg-blue-50 border border-blue-100 text-blue-600 px-2 py-0.5 rounded font-medium">
                SePay / VietQR
              </span>
              <span>Thanh toán an toàn</span>
            </div>

            <button
              onClick={() => navigate("/admin/dashboard")}
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50"
            >
              Thay Đổi Gói
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* ── Modal cảnh báo Downgrade ─────────────────────────────────────── */}
    {showDowngradeModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-full">
              <ShieldAlert size={24} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Xác nhận hạ cấp gói</h3>
              <p className="text-sm text-gray-500">Gói {planName} có một số giới hạn thấp hơn</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-amber-800 mb-2">Những thay đổi sẽ xảy ra:</p>
            <ul className="space-y-1.5">
              {showDowngradeModal.warnings?.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {w}
                </li>
              ))}
              <li className="flex items-start gap-2 text-sm text-amber-700">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                Nếu bạn đang có POI vượt giới hạn mới, hệ thống sẽ giữ nguyên trong 3 ngày.
                Sau đó, POI vượt giới hạn sẽ bị ẩn tự động (các POI mới nhất được giữ lại).
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowDowngradeModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Huỷ, đổi gói khác
            </button>
            <button
              onClick={async () => {
                setShowDowngradeModal(false);
                await proceedToPayment();
              }}
              className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600 transition"
            >
              Hiểu rồi, tiếp tục
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
