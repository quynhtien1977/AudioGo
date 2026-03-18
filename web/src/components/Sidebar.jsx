// import {
//   LayoutDashboard,
//   MapPin,
//   CheckCircle,
//   Route,
//   Layers,
//   BarChart,
//   Users,
// } from "lucide-react"

// export default function Sidebar() {
//   return (
//     <div className="w-64 bg-white border-r p-4">
//       <h1 className="text-lg font-bold text-pink-500 mb-6">
//         <i class="fa-solid fa-map" style={{ marginRight: "8px" }}></i>
//         POI Manager
//       </h1>

//       <div className="space-y-3 text-gray-600">
//         <MenuItem icon={<LayoutDashboard size={18} />} active>
//           Dashboard
//         </MenuItem>
//         <MenuItem icon={<MapPin size={18} />}>POIs</MenuItem>
//         <MenuItem icon={<CheckCircle size={18} />}>Approvals</MenuItem>
//         <MenuItem icon={<Route size={18} />}>Tours</MenuItem>
//         <MenuItem icon={<Layers size={18} />}>Categories</MenuItem>
//         <MenuItem icon={<BarChart size={18} />}>Analytics</MenuItem>
//         <MenuItem icon={<Users size={18} />}>Accounts</MenuItem>
//       </div>
//     </div>
//   )
// }

// function MenuItem({ icon, children, active }) {
//   return (
//     <div
//       className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
//         active ? "bg-pink-100 text-pink-500" : "hover:bg-gray-100"
//       }`}
//     >
//       {icon}
//       {children}
//     </div>
//   )
// }
import {
  LayoutDashboard,
  MapPin,
  CheckCircle,
  Route,
  Layers,
  BarChart,
  Users,
} from "lucide-react"
import { NavLink } from "react-router-dom"

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r p-4">
      <h1 className="text-lg font-bold text-pink-500 mb-6">
        <i class="fa-solid fa-map" style={{ marginRight: "8px" }}></i>  
        POI Manager
      </h1>

      <div className="space-y-2">
        <MenuItem to="/" icon={<LayoutDashboard size={18} />}>
          Dashboard
        </MenuItem>

        <MenuItem to="/pois" icon={<MapPin size={18} />}>
          POIs
        </MenuItem>

        <MenuItem to="/approvals" icon={<CheckCircle size={18} />}>
          Approvals
        </MenuItem>

        <MenuItem to="/tours" icon={<Route size={18} />}>
          Tours
        </MenuItem>

        <MenuItem to="/categories" icon={<Layers size={18} />}>
          Categories
        </MenuItem>

        <MenuItem to="/analytics" icon={<BarChart size={18} />}>
          Analytics
        </MenuItem>

        <MenuItem to="/accounts" icon={<Users size={18} />}>
          Accounts
        </MenuItem>
      </div>
    </div>
  )
}

function MenuItem({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 p-2 rounded-lg transition-all ${
          isActive
            ? "bg-pink-100 text-pink-500"
            : "text-gray-600 hover:bg-pink-50 hover:text-pink-500"
        }`
      }
    >
      {icon}
      {children}
    </NavLink>
  )
}