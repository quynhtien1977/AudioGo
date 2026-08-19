import { createPortal } from "react-dom"
import { X, AlertTriangle, HelpCircle } from "lucide-react"

/**
 * ConfirmModal — dùng chung cho mọi confirm action.
 *
 * Props:
 *   variant: "default" (hồng, cho action trung lập) | "danger" (đỏ, cho delete/lock/reject)
 *   isLoading: hiện spinner + disable buttons khi đang xử lý
 */
const ConfirmModal = ({
  open,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  onCancel,
  isLoading = false,
  variant = "default"   // "default" | "danger"
}) => {
  if (!open) return null

  const isDanger = variant === "danger"

  const confirmBtnClass = isDanger
    ? "px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all"
    : "px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all"

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      
      <div className="bg-white rounded-2xl p-6 w-[420px] shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Icon + Header */}
        <div className="flex items-start gap-3 mb-4">
          {isDanger ? (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
          ) : (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center">
              <HelpCircle size={20} className="text-pink-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-800 leading-snug">{title}</h2>
          </div>
          {onCancel && !isLoading && (
            <button
              onClick={onCancel}
              className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-gray-500 leading-relaxed mb-6 pl-[52px]">
          {message}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-2 pl-[52px]">
          {onCancel && !isLoading && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all text-sm font-medium"
              disabled={isLoading}
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={confirmBtnClass}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang xử lý...
              </>
            ) : confirmText}
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}

export default ConfirmModal