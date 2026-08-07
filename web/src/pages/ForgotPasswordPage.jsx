import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send, CheckCircle } from "lucide-react";
import { forgotPasswordApi } from "@/api/authApi";

const loginBg = "/asset/loginImg.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) return;

    try {
      setLoading(true);
      await forgotPasswordApi(email.trim());
      setSubmitted(true);
    } catch {
      // Luôn hiện màn hình thành công để tránh lộ email enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#EE4B8E] to-[#A3437B] rounded-2xl flex items-center justify-center shadow-lg">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900">AudioGo</span>
            </div>
          </div>

          {submitted ? (
            /* Trạng thái đã gửi */
            <div className="text-center py-8 animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-3">
                Kiểm tra hộp thư
              </h1>
              <p className="text-gray-500 leading-relaxed mb-8">
                Nếu địa chỉ email <strong className="text-gray-700">{email}</strong> tồn tại trong
                hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi tới hộp thư của bạn.
                <br className="mt-2 block" />
                <span className="text-sm text-gray-400 mt-2 block">
                  Kiểm tra cả thư mục Spam nếu không thấy email.
                </span>
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-[#EE4B8E] hover:text-[#D63A79] font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            /* Form nhập email */
            <>
              <h1 className="text-3xl font-black text-gray-900 mb-2">Quên mật khẩu?</h1>
              <p className="text-gray-500 mb-8">
                Nhập email đã đăng ký và chúng tôi sẽ gửi link đặt lại mật khẩu cho bạn.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Địa chỉ Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE4B8E] transition-colors w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#EE4B8E] focus:ring-4 focus:ring-pink-100 outline-none transition-all text-gray-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-[#EE4B8E] hover:bg-[#D63A79] disabled:opacity-60 text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg mt-4"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang gửi...
                    </span>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Gửi link đặt lại
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-[#EE4B8E] text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="hidden md:block w-1/2 relative">
        <img
          src={loginBg}
          alt="AudioGo"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#EE4B8E]/90 via-[#EE4B8E]/40 to-transparent flex flex-col justify-end p-12 text-white">
          <div className="backdrop-blur-md bg-white/10 p-8 rounded-[2rem] border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-black mb-3 leading-tight">
              Đặt lại mật khẩu an toàn
            </h2>
            <p className="text-white/80 font-medium leading-relaxed">
              Link đặt lại mật khẩu sẽ hết hạn sau 30 phút để đảm bảo bảo mật tài khoản của bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
