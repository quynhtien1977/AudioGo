import { useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import SubscriptionPlansBanner from "../components/SubscriptionPlansBanner";
import useAuth from "@/hooks/useAuth";
import { useOwnerNotifications } from "@/hooks/useOwnerNotifications";

export default function MainLayout({ children }) {
  const [showPlansBanner, setShowPlansBanner] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  // #10 — Notify Owner when subscription is about to expire
  useOwnerNotifications(user);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar with responsive mobile drawer support */}
      <Sidebar
        onShowPlans={() => setShowPlansBanner(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Content area */}
      <div className="flex-1 flex flex-col bg-[#fdf7f9] min-w-0 overflow-x-hidden">
        {/* Topbar cố định trên cùng */}
        <Topbar onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

        {/* Nội dung trang */}
        <main className="flex-1 p-3 sm:p-6 min-w-0 max-w-full">{children}</main>
      </div>

      {/* Subscription plans overlay rendered at root viewport level to avoid stacking context issues */}
      <SubscriptionPlansBanner
        isOpen={showPlansBanner}
        onClose={() => setShowPlansBanner(false)}
      />
    </div>
  );
}