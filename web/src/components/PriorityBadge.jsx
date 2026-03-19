export default function PriorityBadge({ value }) {
  const map = {
    CRITICAL: "bg-red-100 text-red-500",
    HIGH: "bg-yellow-100 text-yellow-600",
    MEDIUM: "bg-gray-200 text-gray-600",
    LOW: "bg-gray-100 text-gray-400",
  }

  return (
    <span className={`px-2 py-1 rounded text-xs ${map[value]}`}>
      {value}
    </span>
  )
}