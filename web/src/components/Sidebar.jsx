import {
  LayoutDashboard,
  MapPin,
  CheckCircle,
  Route,
  Layers,
  BarChart,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r p-4 h-screen">
      <h1 className="text-lg font-bold text-pink-500 mb-6 flex items-center">
        <i className="fa-solid fa-map mr-2"></i>
        Culinary Audio Guide
      </h1>

      <div className="space-y-2">
        <MenuItem to="/dashboard" icon={<LayoutDashboard size={18} />}>
          Dashboard
        </MenuItem>

        <MenuItem to="/pois" icon={<MapPin size={18} />}>
          POIs
        </MenuItem>

        <MenuItem to="/categories" icon={<Layers size={18} />}>
          Categories
        </MenuItem>

        {/* Các mục chưa làm */}
        <MenuItem to="/tours" icon={<Route size={18} />} isDisabled>
          Tours
        </MenuItem>

        <MenuItem to="/analytics" icon={<BarChart size={18} />} isDisabled>
          Analytics
        </MenuItem>

        <MenuItem to="/accounts" icon={<Users size={18} />}>
          Accounts
        </MenuItem>
      </div>
    </div>
  );
}

function MenuItem({ to, icon, children, isDisabled = false }) {
  return (
    <NavLink
      to={isDisabled ? "#" : to} // Nếu disabled thì trỏ về #
      onClick={(e) => {
        if (isDisabled) {
          e.preventDefault(); // Chặn điều hướng
        }
      }}
      className={({ isActive }) =>
        `flex items-center gap-3 p-2 rounded-lg transition-all ${
          isDisabled 
            ? "opacity-50 cursor-not-allowed text-gray-400" // Style cho mục chưa làm
            : isActive
              ? "bg-pink-100 text-pink-500"
              : "text-gray-600 hover:bg-pink-50 hover:text-pink-500"
        }`
      }
    >
      {icon}
      <span className="font-medium">{children}</span>
    </NavLink>
  );
}