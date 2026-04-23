/**
 * PriorityBadge — hiển thị độ ưu tiên nhất quán toàn app.
 *
 * Nhận `value` là:
 *  - number: 1=Low, 2=Medium, 3=High, 4=Critical  (từ DB / API)
 *  - string: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" (legacy)
 */

const PRIORITY_MAP = {
  1: { label: "LOW",      color: "bg-gray-100 text-gray-400"   },
  2: { label: "MEDIUM",   color: "bg-gray-200 text-gray-600"   },
  3: { label: "HIGH",     color: "bg-yellow-100 text-yellow-600" },
  4: { label: "CRITICAL", color: "bg-red-100 text-red-500"     },
}

const STRING_TO_NUM = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }

/** Trả về { label, color } từ number hoặc string */
export function getPriorityInfo(value) {
  const num = typeof value === "number" ? value : STRING_TO_NUM[String(value).toUpperCase()]
  return PRIORITY_MAP[num] ?? { label: String(value ?? "—"), color: "bg-gray-100 text-gray-400" }
}

/** Trả về CSS class màu theo priority (dùng thay getPriorityColor inline) */
export function getPriorityColor(value) {
  return getPriorityInfo(value).color
}

/** Trả về label text (thay formatPriority inline) */
export function formatPriority(value) {
  const { label } = getPriorityInfo(value)
  const emoji = { LOW: "🟢", MEDIUM: "🟡", HIGH: "🔴", CRITICAL: "🔥" }[label] ?? ""
  const vi    = { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao", CRITICAL: "Khẩn cấp" }[label] ?? label
  return `${emoji} ${vi} (${label})`
}

/** Badge component */
export default function PriorityBadge({ value }) {
  const { label, color } = getPriorityInfo(value)
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>
      {label}
    </span>
  )
}