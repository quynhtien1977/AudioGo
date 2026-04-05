export default function Card({ title, value, sub, color, icon }) {
  return (
    <div className="bg-white p-5 rounded-2xl border flex items-center">
      <div className="flex-1">
        <p className="text-gray-400 text-sm">{title}</p>
        <h2 className={`text-2xl font-bold ${color || ""}`}>{value}</h2>
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      </div>
      {icon && (
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full bg-pink-50 ${color || "text-gray-500"}`}
        >
          {icon}
        </div>
      )}
    </div>
  );
}