import {
  LayoutDashboard,
  MapPin,
  Route as RouteIcon,
  Layers,
  BarChart,
  Users,
  Map,
  Headphones
} from "lucide-react";
import { NavLink } from "react-router-dom";

import useAuth from "@/hooks/useAuth";

export default function Sidebar() {
  const { user } = useAuth();

  const role = user?.role;

  return (
    <div className="w-64 bg-white border-r p-4 h-screen">
      
      <h1 className="text-lg font-bold text-pink-500 mb-6 flex items-center">
        <Map size={20} className="mr-2" />
        AudioGo Admin 
      </h1>

      <div className="space-y-2">

        <MenuItem to="/dashboard" icon={<LayoutDashboard size={18} />}>
          Tổng quan
        </MenuItem>
        
        {/* ADMIN */}
        {role === "Admin" && (
          <>

            <MenuItem to="/pois" icon={<MapPin size={18} />}>
              POIs
            </MenuItem>

            <MenuItem to="/accounts" icon={<Users size={18} />}>
              Tài khoản
            </MenuItem>
            
            <MenuItem to="/categories" icon={<Layers size={18} />}>
              Danh mục
            </MenuItem>

            <MenuItem to="/tours" icon={<RouteIcon size={18} />} isDisabled>
              Tour
            </MenuItem>
            
          </>
        )}

        {/* OWNER */}
        {role === "Owner" && (
          <>
            <MenuItem to="/pois" icon={<MapPin size={18} />}>
              POIs
            </MenuItem>

            <MenuItem to="/audio" icon={<Headphones size={18} />} isDisabled>
              Audio
            </MenuItem>
          </>
        )}

        {/* DISABLED */}
        {role === "Admin" && (
          <>
            <MenuItem to="/analytics" icon={<BarChart size={18} />} isDisabled>
              Phân tích
            </MenuItem>
          </>
        )}

      </div>
    </div>
  );

  function MenuItem({ to, icon, children, isDisabled = false }) {

  return (
    // NavLink tự thêm class active khi đường dẫn trùng với to, nhưng nếu isDisabled thì sẽ không điều hướng và có style khác
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
  )}
}