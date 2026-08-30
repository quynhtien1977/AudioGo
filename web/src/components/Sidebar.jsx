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
  BarChart3,
  CreditCard,
  DollarSign,
  Sparkles,
  Newspaper,
  Globe,
  Megaphone,
  Settings,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

export default function Sidebar({ onShowPlans, mobileOpen = false, onCloseMobile }) {
  const { user } = useAuth();
  const role = user?.role;

  const sidebarContent = (
    <>
      <div className="space-y-5 flex-1 overflow-y-auto pr-1">
        <SidebarGroup label="TỔNG QUAN">
          <MenuItem to="/admin/dashboard" icon={<LayoutDashboard size={18} />}>
            Tổng quan
          </MenuItem>
        </SidebarGroup>

        {role === "Admin" && (
          <>
            <SidebarGroup label="NỘI DUNG">
              <MenuItem to="/admin/pois" icon={<MapPin size={18} />}>
                POIs
              </MenuItem>
              <MenuItem to="/admin/tours" icon={<RouteIcon size={18} />}>
                Tour
              </MenuItem>
              <MenuItem to="/admin/categories" icon={<Layers size={18} />}>
                Danh mục
              </MenuItem>
              <MenuItem to="/admin/audio" icon={<Headphones size={18} />}>
                Bản dịch & Audio
              </MenuItem>
              <MenuItem to="/admin/articles" icon={<Newspaper size={18} />}>
                Bài viết
              </MenuItem>
              <MenuItem to="/admin/banners" icon={<Megaphone size={18} />}>
                Banners & Sự kiện
              </MenuItem>
              <MenuItem to="/admin/landing" icon={<Globe size={18} />}>
                Trang chủ
              </MenuItem>
            </SidebarGroup>

            <SidebarGroup label="VẬN HÀNH">
              <MenuItem to="/admin/accounts" icon={<Users size={18} />}>
                Tài khoản
              </MenuItem>
              <MenuItem to="/admin/access-codes" icon={<QrCode size={18} />}>
                Mã Truy Cập
              </MenuItem>
              <MenuItem to="/admin/pois/management" icon={<BadgeCheck size={18} />}>
                Xét duyệt
              </MenuItem>
              <MenuItem to="/admin/tracking" icon={<Smartphone size={18} />}>
                Quản lý thiết bị
              </MenuItem>
              <MenuItem to="/admin/device-activity" icon={<RouteIcon size={18} />}>
                Hoạt động thiết bị
              </MenuItem>
            </SidebarGroup>

            <SidebarGroup label="KINH DOANH">
              <MenuItem to="/admin/analytics" icon={<BarChart3 size={18} />}>
                Phân tích
              </MenuItem>
              <MenuItem to="/admin/subscriptions" icon={<CreditCard size={18} />}>
                Quản lý gói
              </MenuItem>
              <MenuItem to="/admin/transactions" icon={<DollarSign size={18} />}>
                Quản lý giao dịch
              </MenuItem>
            </SidebarGroup>

            <SidebarGroup label="HỆ THỐNG">
              <MenuItem to="/admin/settings" icon={<Settings size={18} />}>
                Cài đặt
              </MenuItem>
            </SidebarGroup>
          </>
        )}

        {role === "Owner" && (
          <SidebarGroup label="NỘI DUNG">
            <MenuItem to="/admin/pois" icon={<MapPin size={18} />}>
              POIs
            </MenuItem>
            <MenuItem to="/admin/audio" icon={<Headphones size={18} />}>
              Audio
            </MenuItem>
          </SidebarGroup>
        )}

        {role === "Editor" && (
          <>
            <SidebarGroup label="NỘI DUNG">
              <MenuItem to="/admin/pois" icon={<MapPin size={18} />}>
                POIs
              </MenuItem>
              <MenuItem to="/admin/tours" icon={<RouteIcon size={18} />}>
                Tour
              </MenuItem>
              <MenuItem to="/admin/audio" icon={<Headphones size={18} />}>
                Bản dịch &amp; Audio
              </MenuItem>
              <MenuItem to="/admin/articles" icon={<Newspaper size={18} />}>
                Bài viết
              </MenuItem>
              <MenuItem to="/admin/banners" icon={<Megaphone size={18} />}>
                Banners & Sự kiện
              </MenuItem>
            </SidebarGroup>

            <SidebarGroup label="LANDING PAGE">
              <MenuItem to="/admin/landing" icon={<Globe size={18} />}>
                Nội dung trang
              </MenuItem>
            </SidebarGroup>
          </>
        )}
      </div>

      {role === "Owner" && (
        <div className="mt-auto pt-3">
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              if (onShowPlans) onShowPlans();
            }}
            className="w-full flex items-center gap-3 rounded-lg p-3 bg-pink-50 text-pink-600 hover:bg-pink-100 transition-all font-medium cursor-pointer"
            title="Khám phá các gói tài khoản VIP"
          >
            <Sparkles size={18} />
            <span>Xem gói nâng cấp</span>
          </button>
        </div>
      )}
    </>
  );

  function SidebarGroup({ label, children }) {
    return (
      <div className="flex flex-col gap-1 pt-3.5 first:pt-0 border-t border-gray-100/70 first:border-t-0">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-pink-500/50 hover:text-pink-500/70 px-3 py-1 select-none flex items-center gap-1.5 transition-colors duration-150">
          <span className="w-1 h-1 rounded-full bg-pink-400/80 shadow-sm shadow-pink-500/20"></span>
          <span>{label}</span>
        </div>
        <div className="flex flex-col gap-1">
          {children}
        </div>
      </div>
    );
  }

  function MenuItem({ to, icon, children, isDisabled = false }) {
    return (
      <NavLink
        to={isDisabled ? "#" : to}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
          } else if (onCloseMobile) {
            onCloseMobile();
          }
        }}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg p-2.5 md:p-2 transition-colors duration-150 ${
            isDisabled
              ? "cursor-not-allowed text-gray-400 opacity-50"
              : isActive
                ? "bg-pink-100 text-pink-500 font-semibold"
                : "text-gray-600 hover:bg-pink-50 hover:text-pink-500"
          }`
        }
      >
        {icon}
        <span className="font-medium">{children}</span>
      </NavLink>
    );
  }

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex sticky top-0 h-screen w-64 border-r bg-white p-4 flex-col shrink-0">
        <h1 className="mb-6 flex items-center text-lg font-bold text-pink-500 select-none">
          <Map size={20} className="mr-2" />
          AudioGo
        </h1>
        {sidebarContent}
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          mobileOpen ? "visible" : "invisible pointer-events-none"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onCloseMobile}
        />

        {/* Drawer container */}
        <div
          className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white p-4 flex flex-col shadow-2xl transition-transform duration-300 ease-out z-10 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
            <h1 className="flex items-center text-lg font-bold text-pink-500 select-none">
              <Map size={20} className="mr-2" />
              AudioGo
            </h1>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Đóng menu điều hướng"
              aria-label="Đóng menu"
            >
              <X size={20} />
            </button>
          </div>

          {sidebarContent}
        </div>
      </div>
    </>
  );
}
