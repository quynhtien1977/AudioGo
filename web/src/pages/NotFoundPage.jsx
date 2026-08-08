import { useNavigate } from "react-router-dom";
import { HelpCircle, ArrowLeft, Compass } from "lucide-react";
import useAuth from "@/hooks/useAuth";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleAction = () => {
    if (isAuthenticated) {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-md w-full text-center relative z-10 bg-white/70 backdrop-blur-md border border-white/50 shadow-xl rounded-2xl p-8 md:p-12 transition-all duration-300 hover:shadow-2xl">
        {/* Animated Icon Container */}
        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-pink-50 text-pink-500 ring-4 ring-pink-100/50">
          <Compass size={48} className="animate-spin [animation-duration:15s]" />
          <HelpCircle size={20} className="absolute top-2 right-2 text-rose-400 animate-bounce" />
        </div>

        {/* Text Details */}
        <h1 className="text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 mb-2">
          404
        </h1>
        <h2 className="text-xl font-bold text-gray-800 mb-3">
          Không tìm thấy trang
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Đường dẫn bạn yêu cầu không tồn tại, đã bị di chuyển, hoặc bạn không có quyền truy cập vào khu vực này.
        </p>

        {/* Primary Premium Call To Action Button */}
        <button
          onClick={handleAction}
          className="w-full py-3.5 px-6 font-semibold text-white rounded-xl shadow-lg shadow-pink-500/20 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-98 transition-all duration-150 flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>{isAuthenticated ? "Về trang Tổng quan" : "Quay lại trang Đăng nhập"}</span>
        </button>
      </div>
    </div>
  );
}
