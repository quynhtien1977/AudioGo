import React from 'react';
import { User, LockKeyhole, LogIn, UtensilsCrossed } from 'lucide-react';
// Lưu ý: Đảm bảo bạn đã để ảnh vào đúng thư mục assets
import loginBg from 'D:\\AudioGo\\web\\public\\asset\\loginImg.png'; 

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-pink-50/30 flex items-center justify-center p-4 font-sans">
      {/* Container chính của Card Login */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-pink-100/50 overflow-hidden w-full max-w-4xl flex flex-col md:flex-row border border-pink-100">
        
        {/* PHẦN BÊN TRÁI: FORM ĐĂNG NHẬP */}
        <div className="w-full md:w-1/2 p-10 lg:p-14 flex flex-col justify-center">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 mb-10">
            <div className="bg-[#EE4B8E] p-2 rounded-xl">
              <UtensilsCrossed className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tight">Cuilinary Audio Guide</span>
          </div>

          {/* Header Text */}
          <div className="mb-10">
            <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Welcome!</h1>
            <p className="text-gray-500 font-small">Please log in to manage the culinary area system.</p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE4B8E] transition-colors w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="admin_username" 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#EE4B8E] focus:ring-4 focus:ring-pink-100 outline-none transition-all text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
              <div className="relative group">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE4B8E] transition-colors w-5 h-5" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#EE4B8E] focus:ring-4 focus:ring-pink-100 outline-none transition-all text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#EE4B8E] focus:ring-[#EE4B8E]" />
                <span className="text-sm text-gray-600 group-hover:text-[#EE4B8E] transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-sm font-bold text-[#EE4B8E] hover:underline">Forgot password?</a>
            </div>

            <button className="w-full bg-[#EE4B8E] hover:bg-[#D63A79] text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg mt-4">
              <span>Log in</span>
              <LogIn className="w-5 h-5" />
            </button>
          </form>

          {/* Footer Form */}
          <p className="mt-10 text-center text-gray-400 text-xs font-medium uppercase tracking-widest">
            Internal management system
          </p>
        </div>

        {/* PHẦN BÊN PHẢI: HÌNH ẢNH & OVERLAY (TONE HỒNG) */}
        <div className="hidden md:block w-1/2 relative">
          <img 
            src={loginBg} 
            alt="Culinary Background" 
            className="w-full h-full object-cover"
          />
          {/* Lớp phủ Gradient màu hồng để đồng bộ tone Dashboard */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#EE4B8E]/90 via-[#EE4B8E]/40 to-transparent flex flex-col justify-end p-12 text-white">
            <div className="backdrop-blur-md bg-white/10 p-8 rounded-[2rem] border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-black mb-3 leading-tight">Developing culinary culture through sound</h2>
              <p className="text-white/80 font-medium leading-relaxed">
                Professional automated point-of-interest management system for Admin and Shop Owner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;