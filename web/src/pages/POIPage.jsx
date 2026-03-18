import { Eye, MoreVertical, MapPin } from "lucide-react"

const pois = [
  {
    name: "Le Petit Bistro",
    cuisine: "French Cuisine",
    location: "Paris, France",
    priority: "HIGH",
    status: "Published",
    image: "https://source.unsplash.com/50x50/?bistro",
  },
  {
    name: "Sushi Zen",
    cuisine: "Authentic Japanese",
    location: "Tokyo, Japan",
    priority: "MEDIUM",
    status: "Pending",
    image: "https://source.unsplash.com/50x50/?sushi",
  },
  {
    name: "Pasta Palace",
    cuisine: "Rustic Italian",
    location: "Rome, Italy",
    priority: "LOW",
    status: "Draft",
    image: "https://source.unsplash.com/50x50/?pasta",
  },
]

// 🎯 helper style
const getPriorityStyle = (p) => {
  if (p === "HIGH") return "bg-red-100 text-red-500"
  if (p === "MEDIUM") return "bg-blue-100 text-blue-500"
  return "bg-gray-200 text-gray-500"
}

const getStatusStyle = (s) => {
  if (s === "Published") return "bg-green-100 text-green-600"
  if (s === "Pending") return "bg-yellow-100 text-yellow-600"
  return "bg-gray-100 text-gray-500"
}

export default function POIPage() {
  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">POI Manager</h1>
          <p className="text-gray-500 text-sm">
            Showing all curated culinary spots for your audio tours.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 border border-pink-300 text-pink-500 rounded-lg hover:bg-pink-50">
            Filter
          </button>
          <button className="px-4 py-2 bg-pink-500 text-white rounded-lg shadow">
            + Add POI
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-6 mb-4 text-sm">
        <span className="text-pink-500 border-b-2 border-pink-500 pb-1 font-medium">
          All POIs (42)
        </span>
        <span className="text-gray-400">Pending Approval (12)</span>
        <span className="text-gray-400">Archived</span>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {/* HEADER */}
        <div className="grid grid-cols-6 text-xs text-gray-400 px-6 py-3 border-b">
          <span className="col-span-2">NAME</span>
          <span>LOCATION</span>
          <span>PRIORITY</span>
          <span>STATUS</span>
          <span className="text-right">ACTIONS</span>
        </div>

        {/* ROW */}
        {pois.map((poi, i) => (
          <div
            key={i}
            className="grid grid-cols-6 items-center px-6 py-4 border-b hover:bg-gray-50 transition"
          >
            {/* NAME */}
            <div className="col-span-2 flex items-center gap-3">
              <img
                src={poi.image}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <p className="font-semibold">{poi.name}</p>
                <p className="text-xs text-gray-400">{poi.cuisine}</p>
              </div>
            </div>

            {/* LOCATION */}
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <MapPin size={14} />
              {poi.location}
            </div>

            {/* PRIORITY */}
            <div>
              <span
                className={`px-3 py-1 text-xs rounded-full font-medium ${getPriorityStyle(
                  poi.priority
                )}`}
              >
                {poi.priority}
              </span>
            </div>

            {/* STATUS */}
            <div>
              <span
                className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusStyle(
                  poi.status
                )}`}
              >
                {poi.status}
              </span>
            </div>

            {/* ACTION */}
            <div className="flex justify-end items-center gap-3 text-gray-400">
              {poi.status === "Pending" ? (
                <button className="px-3 py-1 bg-pink-500 text-white text-xs rounded-lg">
                  Approve Request
                </button>
              ) : (
                <Eye size={16} className="cursor-pointer" />
              )}
              <MoreVertical size={16} className="cursor-pointer" />
            </div>
          </div>
        ))}

        {/* FOOTER */}
        <div className="flex justify-between items-center px-6 py-4 text-sm text-gray-400">
          <span>Showing 1 to 3 of 42 POIs</span>

          <div className="flex items-center gap-2">
            <button>{"<"}</button>
            <button className="w-8 h-8 bg-pink-500 text-white rounded-full">
              1
            </button>
            <button>2</button>
            <button>3</button>
            <button>{">"}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

