import { createPortal } from "react-dom"
import { X } from "lucide-react"

const ConfirmModal = ({
  open,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      
      <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          { onCancel && !isLoading && (
            <button onClick={onCancel}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
        )}
          
        </div>

        {/* Content */}
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">

            { onCancel && !isLoading && (
                <button
                    onClick={onCancel}
                    className="px-4 py-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50"
                    disabled={isLoading}
                >
                    {cancelText}
                </button>
            )}
            

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? "Đang xử lý..." : confirmText}
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}

export default ConfirmModal