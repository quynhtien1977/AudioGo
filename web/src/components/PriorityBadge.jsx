import { ShieldCheck, Activity, AlertTriangle, Flame, Shield } from "lucide-react"

/**
 * PriorityBadge — hiển thị độ ưu tiên nhất quán toàn app.
 *
 * Nhận `value` là:
 *  - number: 1=Low, 2=Medium, 3=High, 4=Critical  (từ DB / API)
 *  - string: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" (legacy)
 */

export const PRIORITY_ICONS = {
  LOW: ShieldCheck,
  MEDIUM: Activity,
  HIGH: AlertTriangle,
  CRITICAL: Flame,
}

export const PRIORITY_ICON_COLORS = {
  LOW: "text-emerald-500",
  MEDIUM: "text-amber-500",
  HIGH: "text-orange-500",
  CRITICAL: "text-red-500",
}

const PRIORITY_MAP = {
  1: { label: "LOW",      color: "bg-emerald-50 text-emerald-700 border border-emerald-100",  vi: "Thấp" },
  2: { label: "MEDIUM",   color: "bg-amber-50 text-amber-700 border border-amber-100",        vi: "Trung bình" },
  3: { label: "HIGH",     color: "bg-orange-50 text-orange-700 border border-orange-100",     vi: "Cao" },
  4: { label: "CRITICAL", color: "bg-red-50 text-red-600 border border-red-100",            vi: "Khẩn cấp" },
}

const STRING_TO_NUM = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }

/** Trả về { label, color, vi } từ number hoặc string */
export function getPriorityInfo(value) {
  const num = typeof value === "number" ? value : STRING_TO_NUM[String(value).toUpperCase()]
  return PRIORITY_MAP[num] ?? {
    label: String(value ?? "—"),
    color: "bg-gray-100 text-gray-500 border border-gray-200",
    vi: String(value ?? "—")
  }
}

/** Trả về CSS class màu theo priority */
export function getPriorityColor(value) {
  return getPriorityInfo(value).color
}

/** Trả về component hiển thị Icon + Label tiếng Việt + Mã tiếng Anh */
export function formatPriority(value) {
  const { label, vi } = getPriorityInfo(value)
  const Icon = PRIORITY_ICONS[label] || Shield
  const iconColor = PRIORITY_ICON_COLORS[label] || "text-gray-400"

  return (
    <span className="inline-flex items-center gap-1.5 font-medium">
      <Icon size={16} className={`shrink-0 ${iconColor}`} />
      <span>{vi} ({label})</span>
    </span>
  )
}

/** Badge component tái sử dụng */
export default function PriorityBadge({ value, showIcon = true, className = "" }) {
  const { label, color } = getPriorityInfo(value)
  const Icon = PRIORITY_ICONS[label] || Shield
  const iconColor = PRIORITY_ICON_COLORS[label] || "text-gray-400"

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${color} ${className}`}>
      {showIcon && <Icon size={13} className={`shrink-0 ${iconColor}`} />}
      <span>{label}</span>
    </span>
  )
}