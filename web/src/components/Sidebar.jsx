import {
  LayoutDashboard,
  MapPin,
  Route as RouteIcon,
  Layers,
  Users,
  Map,
  Headphones,
  BadgeCheck,
  QrCode,
  Smartphone,
  Route as RouteIcon2,
  BarChart3,
  CreditCard,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";

import useAuth from "@/hooks/useAuth";
import SubscriptionPlansBanner from "./SubscriptionPlansBanner";

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role;
  const [showPlansBanner, setShowPlansBanner] = useState(false);

  return (
    <div className="sticky top-0 h-screen w-64 border-r bg-white p-4 flex flex-col">
      <h1 className="mb-6 flex items-center text-lg font-bold text-pink-500">
        <Map size={20} className="mr-2" />
        AudioGo
      </h1>

      <div className="space-y-2 flex-1 overflow-y-auto">
        <MenuItem to="/dashboard" icon={<LayoutDashboard size={18} />}>
          Tổng quan
        </MenuItem>

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

            <MenuItem to="/tours" icon={<RouteIcon size={18} />}>
              Tour
            </MenuItem>

            <MenuItem to="/audio" icon={<Headphones size={18} />}>
              Bản dịch & Audio
            </MenuItem>

            <MenuItem to="/poi/management" icon={<BadgeCheck size={18} />}>
              Xét duyệt
            </MenuItem>

            <MenuItem to="/analytics" icon={<BarChart3 size={18} />}>
              Phân tích
            </MenuItem>

            <MenuItem to="/access-codes" icon={<QrCode size={18} />}>
              Mã Truy Cập
            </MenuItem>

            <MenuItem to="/admin/subscriptions" icon={<CreditCard size={18} />}>
              Quản lý gói
            </MenuItem>

            <MenuItem to="/admin/transactions" icon={<DollarSign size={18} />}>
              Quản lý giao dịch
            </MenuItem>

            <MenuItem to="/tracking" icon={<Smartphone size={18} />}>
              Quản lý thiết bị
            </MenuItem>

            <MenuItem to="/device-activity" icon={<RouteIcon2 size={18} />}>
              Hoạt động thiết bị
            </MenuItem>



          </>
        )}

        {role === "Owner" && (
          <>
            <MenuItem to="/pois" icon={<MapPin size={18} />}>
              POIs
            </MenuItem>

            <MenuItem to="/audio" icon={<Headphones size={18} />}>
              Audio
            </MenuItem>
          </>
        )}
      </div>

      {role === "Owner" && (
        <div className="mt-auto pt-3">
          <button
            onClick={() => setShowPlansBanner(true)}
            className="w-full flex items-center gap-3 rounded-lg p-3 bg-pink-50 text-pink-600 hover:bg-pink-100 transition-all font-medium"
          >
            <Sparkles size={18} />
            <span>Xem gói nâng cấp</span>
          </button>
        </div>
      )}

      <SubscriptionPlansBanner
        isOpen={showPlansBanner}
        onClose={() => setShowPlansBanner(false)}
      />
    </div>
  );

  function MenuItem({ to, icon, children, isDisabled = false }) {
    return (
      <NavLink
        to={isDisabled ? "#" : to}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
          }
        }}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg p-2 transition-colors duration-150 ${
            isDisabled
              ? "cursor-not-allowed text-gray-400 opacity-50"
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
}
