import { Loader2 } from "lucide-react"

/**
 * Shared full-page loading spinner.
 * Usage: <PageLoader /> or <PageLoader text="Đang tải..." />
 */
export default function PageLoader({ text = "Đang tải dữ liệu..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-pink-500">
      <Loader2 className="animate-spin mb-3" size={36} />
      <p className="text-sm font-semibold text-gray-500">{text}</p>
    </div>
  )
}
