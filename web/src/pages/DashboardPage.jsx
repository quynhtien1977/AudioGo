import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import StatsCard from "../components/StatsCard"
import TrendingChart from "../components/TrendingChart"
import { MapPin, Headphones } from "lucide-react" 

export default function DashboardPage() {
  return (
    <div className="flex bg-[#fdf7f9] min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Dashboard Overview
            </h1>
            <p className="text-gray-500">
              Welcome back! Here's the latest data for your point of interest network.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6">
            <StatsCard
              title="TOTAL POIs"
              value="84"
              percent="+5.2%"
              icon={<MapPin size={20} />}
            />

            <StatsCard
              title="TOTAL AUDIO PLAYS"
              value="12,450"
              percent="+12.5%"
              icon={<Headphones size={20} />}
            />
          </div>

          {/* Chart Box */}
          <TrendingChart />

          {/* Table */}
          <div className="bg-white rounded-2xl border p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">Top Popular POIs</h2>
              <span className="text-pink-500 cursor-pointer hover:text-pink-400">View All <i class="fa-solid fa-arrow-right"></i></span>
            </div>

            <table className="w-full text-sm">
              <thead className="text-gray-400 text-left">
                <tr>
                  <th>POI NAME</th>
                  <th>LOCATION</th>
                  <th>TRAFFIC STATUS</th>
                  <th>LISTEN RATE</th>
                </tr>
              </thead>

              <tbody className="text-gray-700">
                <tr className="border-t">
                  <td className="py-3">The Pastel Bistro</td>
                  <td>Sector 7, Central</td>
                  <td>
                    <span className="bg-pink-100 text-pink-500 px-2 py-1 rounded">
                      High
                    </span>
                  </td>
                  <td>1,240 hrs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}