import { useState } from "react"
import { createPortal } from "react-dom"
import { Crown, Check, X, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { assignPlanToOwnerApi } from "@/api/subscriptionApi"

/**
 * AssignPlanModal — Modal gán gói cước cho Owner tài khoản
 * Sử dụng createPortal(..., document.body) để overlay phủ 100% viewport.
 */
export default function AssignPlanModal({
  open,
  owner,
  plans = [],
  onClose,
  onAssigned,
}) {
  const activePlans = plans.filter((p) => p.isActive !== false)

  const [selectedPlanId, setSelectedPlanId] = useState(
    owner?.subscriptionPlanId || activePlans[0]?.planId || ""
  )
  const [loading, setLoading] = useState(false)

  if (!open || !owner) return null

  const currentPlan = plans.find(
    (p) => String(p.planId) === String(owner.subscriptionPlanId)
  )

  const handleConfirm = async () => {
    if (!selectedPlanId) {
      toast.error("Vui lòng chọn 1 gói cước")
      return
    }

    setLoading(true)
    try {
      await assignPlanToOwnerApi(owner.accountId, selectedPlanId)
      toast.success("Gán gói cước cho đối tác thành công!")
      if (onAssigned) {
        onAssigned(owner.accountId, selectedPlanId)
      }
      onClose()
    } catch (err) {
      console.error("Assign plan failed:", err)
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Gán gói thất bại. Vui lòng thử lại!"
      )
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Crown size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">
                Gán gói cước cho đối tác
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Kích hoạt quyền quản lý POI trực tiếp cho tài khoản Owner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Owner Info Summary Card */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Đối tác:</span>
            <span className="font-bold text-gray-800">
              {owner.fullName || owner.username} (@{owner.username})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email:</span>
            <span className="text-gray-700">{owner.email || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Gói hiện tại:</span>
            <span className="font-semibold text-pink-600">
              {currentPlan?.name || "Chưa có gói"}
            </span>
          </div>
        </div>

        {/* Plan Selection Cards */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Chọn gói cước muốn gán <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {activePlans.map((p) => {
              const isSelected = String(selectedPlanId) === String(p.planId)
              return (
                <div
                  key={p.planId}
                  onClick={() => setSelectedPlanId(p.planId)}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-pink-500 bg-pink-50/30 shadow-xs"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-xs text-gray-900">
                      {p.name}
                    </span>
                    {isSelected && (
                      <Check size={14} className="text-pink-600 font-bold" />
                    )}
                  </div>
                  <div className="mt-2 space-y-0.5 text-[11px] text-gray-500">
                    <p>
                      Thời hạn:{" "}
                      <span className="font-medium text-gray-700">
                        {p.durationDay || 30} ngày
                      </span>
                    </p>
                    <p>
                      Giới hạn:{" "}
                      <span className="font-medium text-gray-700">
                        {p.maxPoiCount} POI
                      </span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Note */}
        <div className="p-3 rounded-xl bg-pink-50/40 border border-pink-100 text-[11px] text-gray-600 space-y-1">
          <p className="font-semibold text-pink-700">
            Lưu ý khi gán gói thủ công:
          </p>
          <ul className="list-disc pl-4 space-y-0.5 text-gray-500">
            <li>
              Gói cước sẽ được kích hoạt ngay lập tức cho đối tác (phương thức
              MANUAL).
            </li>
            <li>
              Thông báo tự động sẽ được gửi tới chuông thông báo của Owner này.
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={loading || !selectedPlanId}
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 active:scale-95 text-white text-xs font-bold transition shadow-md shadow-pink-500/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Đang gán gói...</span>
              </>
            ) : (
              "Xác nhận gán gói"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
