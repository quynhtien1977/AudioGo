import React from 'react';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LockKeyhole, LogIn, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';

import useAuth from "@/hooks/useAuth";

const loginBg = "/asset/loginImg.png";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const { login, loading, error } = useAuth()
  const navigate = useNavigate()


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!username.trim() || !password.trim()) {
        toast.error("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
        return;
      }

      const res = await login(username, password, rememberMe);

      const role = res?.user?.role;

      if (!role) {
        toast.error("Không có quyền truy cập");
        return;
      }

      if (["Admin", "Owner"].includes(role)) {
        navigate("/dashboard");
      } else {
        navigate("/");
      }

    } catch (err) {
      toast.error(err || "Đăng nhập thất bại"); 
    }
  };
  
  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-100/50 overflow-hidden w-full max-w-4xl flex flex-col md:flex-row border border-gray-100">
        
        {/* LEFT */}
        <div className="w-full md:w-1/2 p-10 lg:p-14 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-10">
            <div className="bg-[#EE4B8E] p-2 rounded-xl">
              <UtensilsCrossed className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              AudioGo
            </span>
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">
              Chào mừng!
            </h1>
            <p className="text-gray-500 font-small">
              Vui lòng đăng nhập để quản lý hệ thống khu vực ẩm thực
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Tên đăng nhập</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE4B8E] transition-colors w-5 h-5" />
                <input 
                  type="text" 
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tên đăng nhập của bạn  " 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#EE4B8E] focus:ring-4 focus:ring-pink-100 outline-none transition-all text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Mật khẩu</label>
              <div className="relative group">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE4B8E] transition-colors w-5 h-5" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#EE4B8E] focus:ring-4 focus:ring-pink-100 outline-none transition-all text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    className="w-4 h-4 rounded border-gray-300 text-[#EE4B8E] focus:ring-[#EE4B8E]" />
                <span className="text-sm text-gray-600 group-hover:text-[#EE4B8E] transition-colors">
                  Ghi nhớ đăng nhập
                </span>
              </label>
            </div>

            <button className="w-full bg-[#EE4B8E] hover:bg-[#D63A79] text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg mt-4">
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              <LogIn className="w-5 h-5" />
            </button>
          </form>

          <p className="mt-10 text-center text-gray-400 text-xs font-medium uppercase tracking-widest">
            Hệ thống quản lý nội bộ
          </p>
        </div>

        {/* RIGHT */}
        <div className="hidden md:block w-1/2 relative">
          <img 
            src={loginBg} 
            alt="Hình ảnh ẩm thực" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#EE4B8E]/90 via-[#EE4B8E]/40 to-transparent flex flex-col justify-end p-12 text-white">
            <div className="backdrop-blur-md bg-white/10 p-8 rounded-[2rem] border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-black mb-3 leading-tight">
                Phát triển văn hóa ẩm thực thông qua âm thanh
              </h2>
              <p className="text-white/80 font-medium leading-relaxed">
                Hệ thống quản lý khu vực ẩm thực cho Admin và Chủ cửa hàng.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;