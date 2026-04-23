export default function TopPOIModal({ onClose, pois = [] }) {

  const getCategoryColor = (category) => {
    switch (category) {
      case "Ẩm thực":
        return "bg-pink-100 text-pink-500"
      case "Hải sản & Ốc":
        return "bg-cyan-100 text-cyan-500"
      case "Cà phê & Giải khát":
        return "bg-orange-100 text-orange-500"
      case "Di tích lịch sử":
        return "bg-blue-100 text-blue-500"
      case "Chùa & Tôn giáo":
        return "bg-purple-100 text-purple-500"
      default:
        return "bg-gray-100 text-gray-500"
    }
  }

  // 🔥 max listens
  const maxListens = Math.max(...pois.map(p => p.listens || 0), 1)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[900px] rounded-2xl shadow-xl p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">CÁC POIs PHỔ BIẾN</h2>

          <button onClick={onClose} className="text-gray-400 hover:text-black">
            ✕
          </button>
        </div>

        {/* Table */}
        <div className="mt-4">
          <table className="w-full text-sm">
            <thead className="text-gray-400 text-left">
              <tr>
                <th>XẾP HẠNG</th>
                <th>TÊN POI</th>
                <th>VỊ TRÍ</th>
                <th>THỂ LOẠI</th>
                <th>LƯỢT NGHE</th>
              </tr>
            </thead>

            <tbody className="text-gray-700">
              {pois.map((poi) => {
                const percent = Math.round((poi.listens / maxListens) * 100)

                return (
                  <tr key={poi.rank} className="border-t">
                    
                    {/* Rank */}
                    <td className="py-4 font-semibold">
                      {String(poi.rank).padStart(2, "0")}
                    </td>

                    {/* Title */}
                    <td className="font-medium">
                      {poi.name}
                    </td>

                    {/* Location */}
                    <td>
                      {poi.lat}, {poi.lng}
                    </td>

                    {/* Category */}
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(poi.category)}`}>
                        {poi.category}
                      </span>
                    </td>

                    {/* Listens */}
                    <td>
                      <div className="flex flex-col gap-1">
                        <span>{poi.listens} lượt</span>

                        <div className="w-full h-2 bg-gray-200 rounded">
                          <div
                            className="h-2 bg-pink-500 rounded"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <span className="text-xs text-pink-500 text-right">
                          {percent}%
                        </span>
                      </div>
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}