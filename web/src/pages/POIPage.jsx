import { useEffect, useState } from "react"
import { getTopPOIs } from "../api/poiApi"
import POIMap from "../components/POIMap"
import Card from "../components/Card"
import Filter from "../components/Filter"
import StatusBadge from "../components/StatusBadge"
import {
  Utensils,
  TreePine,
  BookOpen,
  Bus,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle
} from "lucide-react"

export default function POIPage() {
  const [pois, setPois] = useState([])

  // ✅ PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  useEffect(() => {
    getTopPOIs().then(setPois)
  }, [])

  // ✅ PAGINATION LOGIC
  const totalItems = pois.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  const currentPOIs = pois.slice(startIndex, endIndex)

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleApprove = (id) => {
    setPois((prev) =>
      prev.map((p) =>
        p.rank === id ? { ...p, status: "APPROVED" } : p
      )
    )
  }

  const handleSetPriority = (id, newPriority) => {
    setPois((prev) =>
      prev.map((p) =>
        p.rank === id ? { ...p, priority: newPriority } : p
      )
    )
  }

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "Restaurant": return <Utensils size={16} />
      case "Outdoors": return <TreePine size={16} />
      case "Education": return <BookOpen size={16} />
      case "Transit": return <Bus size={16} />
      default: return null
    }
  }

  const getPriorityColor = (value) => {
    switch (value) {
      case "CRITICAL": return "bg-red-100 text-red-500"
      case "HIGH": return "bg-yellow-100 text-yellow-600"
      case "MEDIUM": return "bg-gray-200 text-gray-600"
      case "LOW": return "bg-gray-100 text-gray-400"
      default: return ""
    }
  }

  return (
    <div className="p-6 bg-pink-50/30 min-h-screen space-y-6">

      <h1 className="text-2xl font-bold">POI Data Management</h1>

      {/* STAT */}
      <div className="grid grid-cols-3 gap-6">
        <Card title="TOTAL POIs" value={totalItems} sub="+2.4% this month" />
        <Card title="PENDING APPROVAL" value="148" sub="Requires attention" color="text-orange-500" />
        <Card title="HIGH PRIORITY" value="24" sub="Critical verification" color="text-red-500" />
      </div>

      {/* FILTER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border">
        <div className="flex gap-3">
          <Filter label="Status: All" active />
          <Filter label="Category: Food & Drink" />
          <Filter label="Priority: High" />
          <Filter label="More Filters" icon={<SlidersHorizontal size={14} />} />
        </div>
        <div className="text-sm text-gray-500">
          Sort by: <span className="font-semibold text-gray-700">Last Updated</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-400">
            <tr>
              <th className="p-4 text-left">NAME</th>
              <th className="p-4 text-left">CATEGORY</th>
              <th className="p-4 text-left">LOCATION</th>
              <th className="p-4 text-left">PRIORITY</th>
              <th className="p-4 text-left">STATUS</th>
              <th className="p-4 text-left">APPROVAL</th>
            </tr>
          </thead>

          <tbody>
            {currentPOIs.map((poi) => (
              <tr key={poi.rank} className="border-t hover:bg-gray-50">

                <td className="p-4">
                  <p className="font-semibold">{poi.name}</p>
                  <p className="text-xs text-gray-400">ID: POI-{poi.rank}</p>
                </td>

                <td className="p-4 flex items-center gap-2 text-gray-600">
                  {getCategoryIcon(poi.category)}
                  {poi.category}
                </td>

                <td className="p-4">
                  <p>{poi.location}</p>
                  <p className="text-xs text-gray-400">
                    {poi.lat}, {poi.lng}
                  </p>
                </td>

                {/* ✅ FIX LỆCH CỘT */}
                <td className="p-4">
                  <select
                    value={poi.priority}
                    onChange={(e) => handleSetPriority(poi.rank, e.target.value)}
                    className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(poi.priority)}`}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </td>

                <td className="p-4">
                  <StatusBadge value={poi.status} />
                </td>

                <td className="p-4">
                  <button
                    onClick={() => handleApprove(poi.rank)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      poi.status === "APPROVED"
                        ? "bg-gray-200 text-gray-400"
                        : "bg-pink-100 text-pink-500 hover:bg-pink-200"
                    }`}
                  >
                    <CheckCircle size={16} />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex justify-between items-center p-4 text-sm text-gray-500">
          <p>
            Showing {startIndex + 1} - {Math.min(endIndex, totalItems)} of {totalItems} POIs
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border rounded-lg hover:bg-pink-500 hover:text-white disabled:opacity-50"
            >
              <ChevronLeft size={14} />
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`px-3 py-1 rounded-lg ${
                  currentPage === i + 1
                    ? "bg-pink-500 text-white"
                    : "border hover:bg-pink-500 hover:text-white"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border rounded-lg hover:bg-pink-500 hover:text-white disabled:opacity-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* MAP */}
      <div className="bg-white p-6 rounded-2xl border">
        <h2 className="font-semibold mb-4">Map POI</h2>
        <POIMap pois={pois} />
      </div>
    </div>
  )
}