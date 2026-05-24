import { useState } from "react";
import { Link } from "react-router-dom";

import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import SubscriptionPlansBanner from "../components/SubscriptionPlansBanner";

export default function MainLayout({ children }) {
  const [showPlansBanner, setShowPlansBanner] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar onShowPlans={() => setShowPlansBanner(true)} />

      {/* Content area */}
      <div className="flex-1 flex flex-col bg-[#fdf7f9]">
        {/* Topbar cố định trên cùng */}
        <Topbar />

        {/* Nội dung trang */}
        <div className="flex-1 p-6">{children}</div>
      </div>

      {/* Subscription plans overlay rendered at root viewport level to avoid stacking context issues */}
      <SubscriptionPlansBanner
        isOpen={showPlansBanner}
        onClose={() => setShowPlansBanner(false)}
      />
    </div>
  );
}