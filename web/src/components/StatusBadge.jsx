export default function StatusBadge({ value }) {
  return (
    <span className={value === "PENDING" ? "text-orange-500" : "text-pink-500"}>
      ● {value}
    </span>
  )
}