import { Link } from "react-router-dom";

import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";


export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
       <Sidebar />

      {/* Content area */}
      <div className="flex-1 flex flex-col bg-[#fdf7f9]">
        {/* Topbar cố định trên cùng */}
        <Topbar />

        {/* Nội dung trang */}
        <div className="flex-1 p-6">{children}</div>
        
      </div>

    </div>
  );
}