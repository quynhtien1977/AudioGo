import { useEffect, useState } from "react"
import { getTopPOIs } from "@/api/analyticsApi"

export default function TopPOIModal({ onClose }) {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getTopPOIs()
        setData(res)
      } catch (err) {
        console.error(err)
      }
    }
    fetch()
  }, [])

  const getCategoryColor = (category) => {
    switch (category) {
      case "Restaurant":
        return "bg-pink-100 text-pink-500"
      case "Cafe":
        return "bg-orange-100 text-orange-500"
      case "Museum":
        return "bg-blue-100 text-blue-500"
      default:
        return "bg-gray-100 text-gray-500"
    }
  }

  // 🔥 tính max 1 lần
  const maxListens = Math.max(...data.map(d => d.count || 0), 1)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[800px] rounded-2xl shadow-xl p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">CÁC POIs PHỔ BIẾN</h2>
          </div>

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
              {data.map((item, index) => {
                const percent = Math.round((item.count / maxListens) * 100)

                return (
                  <tr key={item.poiId} className="border-t">
                    
                    {/* Rank */}
                    <td className="py-4 font-semibold">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    {/* Title */}
                    <td className="font-medium">
                      {item.title || "Unknown"}
                    </td>

                    {/* Location */}
                    <td>
                      Unknown
                    </td>

                    {/* Category */}
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor("Unknown")}`}>
                        Unknown
                      </span>
                    </td>

                    {/* Listens */}
                    <td>
                      <div className="flex flex-col gap-1">
                        <span>{item.count || 0} lượt</span>

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