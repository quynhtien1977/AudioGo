export default function StatsCard({ title, value, icon }) {
  return (
    <div className="bg-white p-5 rounded-2xl border flex justify-between items-center">
      
      {/* Left */}
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <div className="flex items-center gap-3 mt-2">
          <h2 className="text-2xl font-bold">{value}</h2>
        </div>
      </div>

      {/* Right Icon */}
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-pink-100 text-pink-500">
        {icon}
      </div>
    </div>
  )
}