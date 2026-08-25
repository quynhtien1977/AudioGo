import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { LockKeyhole, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { resetPasswordApi } from "@/api/authApi";

const loginBg = "/asset/loginImg.png";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Kiểm tra token có trong URL không
  const hasToken = !!token;

  // Validate độ mạnh
  const isStrong = newPassword.length >= 8 &&
    /[a-zA-Z]/.test(newPassword) &&
    /\d/.test(newPassword);
  const isMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isStrong) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái và số.");
      return;
    }
    if (!isMatch) {
      toast.error("Xác nhận mật khẩu không khớp.");
      return;
    }

    try {
      setLoading(true);
      await resetPasswordApi(token, newPassword);
      setDone(true);
      toast.success("Đặt lại mật khẩu thành công!");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      toast.error(err || "Đặt lại mật khẩu thất bại. Token có thể đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  // Không có token → hiện lỗi
  if (!hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-3">Link không hợp lệ</h1>
          <p className="text-gray-500 mb-8">
            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 bg-[#EE4B8E] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#D63A79] transition-colors"
          >
            Yêu cầu link mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#EE4B8E] to-[#A3437B] rounded-2xl flex items-center justify-center shadow-lg">
                <LockKeyhole className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900">AudioGo</span>
            </div>
          </div>

          {done ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-3">
                Đặt lại thành công!
              </h1>
              <p className="text-gray-500 mb-4">
                Mật khẩu của bạn đã được cập nhật. Đang chuyển về trang đăng nhập...
              </p>
              <Link to="/login" className="text-[#EE4B8E] hover:underline font-medium text-sm">
                Đăng nhập ngay
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-black text-gray-900 mb-2">Đặt lại mật khẩu</h1>
              <p className="text-gray-500 mb-8">
                Nhập mật khẩu mới cho tài khoản của bạn.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Mật khẩu mới */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Mật khẩu mới
                  </label>
                  <div className="relative group">
                    <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE4B8E] transition-colors w-5 h-5" />
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ít nhất 8 ký tự, có chữ và số"
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#EE4B8E] focus:ring-4 focus:ring-pink-100 outline-none transition-all text-gray-900"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#EE4B8E] transition-colors">
                      {showNew ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {newPassword && (
                    <p className={`text-xs ml-1 ${isStrong ? "text-green-500" : "text-orange-400"}`}>
                      {isStrong ? "✓ Mật khẩu đạt yêu cầu" : "✗ Cần ít nhất 8 ký tự, bao gồm chữ cái và số"}
                    </p>
                  )}
                </div>

                {/* Xác nhận mật khẩu */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative group">
                    <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE4B8E] transition-colors w-5 h-5" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#EE4B8E] focus:ring-4 focus:ring-pink-100 outline-none transition-all text-gray-900"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#EE4B8E] transition-colors">
                      {showConfirm ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className={`text-xs ml-1 ${isMatch ? "text-green-500" : "text-red-400"}`}>
                      {isMatch ? "✓ Mật khẩu khớp" : "✗ Mật khẩu không khớp"}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !isStrong || !isMatch}
                  className="w-full bg-[#EE4B8E] hover:bg-[#D63A79] disabled:opacity-60 text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg mt-4"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang lưu...
                    </span>
                  ) : "Đặt lại mật khẩu"}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link to="/login"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-[#EE4B8E] text-sm font-medium transition-colors">
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
        <img src={loginBg} alt="AudioGo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#EE4B8E]/90 via-[#EE4B8E]/40 to-transparent flex flex-col justify-end p-12 text-white">
          <div className="backdrop-blur-md bg-white/10 p-8 rounded-[2rem] border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-black mb-3 leading-tight">Bảo mật tài khoản</h2>
            <p className="text-white/80 font-medium leading-relaxed">
              Sử dụng mật khẩu mạnh có ít nhất 8 ký tự, bao gồm chữ cái và số để bảo vệ tài khoản.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
