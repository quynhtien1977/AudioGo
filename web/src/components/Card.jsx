export default function Card({ title, value, sub, color }) {
  return (
    <div className="bg-white p-5 rounded-2xl border">
      <p className="text-gray-400 text-sm">{title}</p>
      <h2 className={`text-2xl font-bold ${color || ""}`}>{value}</h2>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}   