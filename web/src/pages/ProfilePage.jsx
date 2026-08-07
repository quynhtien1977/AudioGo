import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Save, CornerDownLeft, Loader2, LockKeyhole, Eye, EyeOff, AlertTriangle } from "lucide-react"
import PageLoader from "@/components/PageLoader"
import toast from "react-hot-toast"

import ConfirmModal from "@/components/ConfirmModal"
import { getUserByIdApi, updateMyProfileApi } from "@/api/accountApi"
import { changePasswordApi } from "@/api/authApi"
import { isValidEmailFormat, isValidPhone, isEmailDomainValid } from "@/utils/validators"
import useAuth from "@/hooks/useAuth"
import { formatDateVN } from "@/utils/formatDate"

const ProfilePage = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()

  const [user, setUser] = useState(null)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({ email: "", phoneNumber: "" })
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)

  // ── Đổi mật khẩu state ───────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" })
  const [pwErrors, setPwErrors] = useState({})
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [isChangingPw, setIsChangingPw] = useState(false)

  // Đọc flag mustChangePassword từ storage
  const mustChangePassword = (() => {
    try {
      const raw = localStorage.getItem("user") || sessionStorage.getItem("user")
      return raw ? JSON.parse(raw)?.mustChangePassword === true : false
    } catch { return false }
  })()

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!authUser?.accountId) {
          toast.error("Không tìm thấy thông tin người dùng")
          navigate("/dashboard")
          return
        }

        const userData = await getUserByIdApi(authUser.accountId)
        setUser(userData)
        setForm(userData)
      } catch (err) {
        console.error("Fetch user profile failed:", err)
        toast.error("Lỗi tải thông tin cá nhân")
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [authUser?.accountId, navigate])  // dùng primitive string, tránh object reference trigger vòng lặp

  // Validate inline khi gõ
  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))

    if (key === "email") {
      setErrors((prev) => ({
        ...prev,
        email: value && !isValidEmailFormat(value) ? "Email không đúng định dạng (VD: abc@gmail.com)" : "",
      }))
    }

    if (key === "phoneNumber") {
      setErrors((prev) => ({
        ...prev,
        phoneNumber: value && !isValidPhone(value) ? "SĐT không hợp lệ. Nhập 10 số bắt đầu bằng 0 (VD: 0901234567)" : "",
      }))
    }
  }

  // Validate trước khi mở modal confirm
  const handleSave = async () => {
    if (!form.fullName?.trim()) {
      toast.error("Vui lòng nhập họ tên")
      return
    }
    if (!form.email?.trim() || !isValidEmailFormat(form.email)) {
      toast.error("Email không đúng định dạng")
      return
    }
    if (!form.phoneNumber?.trim() || !isValidPhone(form.phoneNumber)) {
      toast.error("SĐT không hợp lệ. Nhập 10 số bắt đầu bằng 0")
      return
    }

    // Kiểm tra domain email có tồn tại không (MX lookup)
    setIsCheckingEmail(true)
    try {
      const emailOk = await isEmailDomainValid(form.email)
      if (!emailOk) {
        toast.error("Domain email không tồn tại. Dùng email thực (VD: @gmail.com, @company.vn)")
        return
      }
    } finally {
      setIsCheckingEmail(false)
    }

    setShowConfirm(true)
  }

  const handleConfirmSave = async () => {
    if (isSubmitting) return
    try {
      setIsSubmitting(true)

      await updateMyProfileApi({
        fullName: form.fullName,
        email: form.email,
        phoneNumber: form.phoneNumber,
      })

      setUser(form)

      // ── P1-B: Sync localStorage/sessionStorage → Topbar re-render ──────
      const currentRaw = localStorage.getItem("user")
      const currentUser = JSON.parse(currentRaw || sessionStorage.getItem("user") || "{}")
      const updatedUser = { ...currentUser, fullName: form.fullName }

      if (currentRaw) {
        localStorage.setItem("user", JSON.stringify(updatedUser))
      } else {
        sessionStorage.setItem("user", JSON.stringify(updatedUser))
      }
      // Trigger Topbar re-render (storage event không tự fire trong cùng tab)
      window.dispatchEvent(new Event("storage"))

      toast.success("Cập nhật thông tin cá nhân thành công!")
      setIsEditing(false)
      setShowConfirm(false)
    } catch (err) {
      console.error(err)
      const message = err?.response?.data || "Cập nhật thông tin thất bại!"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setForm(user)
    setErrors({ email: "", phoneNumber: "" })
  }

  // ── Xử lý đổi mật khẩu ───────────────────────────────────────────
  const handleChangePw = async (e) => {
    e.preventDefault()
    const errs = {}

    if (!pwForm.oldPassword) errs.oldPassword = "Vui lòng nhập mật khẩu cũ"
    if (pwForm.newPassword.length < 8 || !/[a-zA-Z]/.test(pwForm.newPassword) || !/\d/.test(pwForm.newPassword))
      errs.newPassword = "Mật khẩu mới phải ≥ 8 ký tự, có cả chữ và số"
    if (pwForm.newPassword !== pwForm.confirmPassword)
      errs.confirmPassword = "Xác nhận mật khẩu không khớp"

    if (Object.keys(errs).length > 0) { setPwErrors(errs); return }
    setPwErrors({})

    try {
      setIsChangingPw(true)
      await changePasswordApi(pwForm.oldPassword, pwForm.newPassword)

      // Xóa flag mustChangePassword khỏi storage
      const storage = localStorage.getItem("user") ? localStorage : sessionStorage
      const userData = JSON.parse(storage.getItem("user") || "{}")
      storage.setItem("user", JSON.stringify({ ...userData, mustChangePassword: false }))

      toast.success("Đổi mật khẩu thành công!")
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err) {
      toast.error(err || "Đổi mật khẩu thất bại")
    } finally {
      setIsChangingPw(false)
    }
  }

  if (loading) {
    return <PageLoader text="Đang tải thông tin cá nhân..." />
  }
  if (!user) return <div className="p-6 text-red-500">Not found</div>

  return (
    <div className="p-8 bg-pink-50/20 min-h-screen space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">THÔNG TIN CÁ NHÂN</h1>
          <p className="text-gray-500 text-sm mt-2">Quản lý hồ sơ và cài đặt tài khoản của bạn</p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 rounded-2xl font-bold text-gray-400 hover:bg-white transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest"
        >
          <CornerDownLeft size={16} /> Quay lại
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* LEFT - Main Profile */}
        <div className="col-span-8 space-y-6">
          {/* Profile Info Section */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
              <h2 className="text-lg font-bold text-gray-700">Thông tin cơ bản</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-bold hover:bg-pink-600 transition"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Username (Read-only) */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-2">
                  Tên đăng nhập
                </label>
                <div className="w-full bg-gray-50 border-2 border-gray-100 py-3 px-4 rounded-lg text-gray-600 font-medium">
                  {form.username}
                </div>
                <p className="text-xs text-gray-400 italic mt-1">Không thể thay đổi</p>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-2">
                  Họ và tên
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.fullName || ""}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className="w-full bg-transparent border-b-2 border-pink-200 py-3 px-1 outline-none focus:border-pink-500 transition-all font-bold text-gray-700"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border-2 border-gray-100 py-3 px-4 rounded-lg text-gray-600 font-medium">
                    {form.fullName || "N/A"}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-2">
                  Email
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="email"
                      value={form.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={`w-full bg-transparent border-b-2 py-3 px-1 outline-none transition-all font-bold text-gray-700
                        ${errors.email ? "border-red-400 focus:border-red-500" : "border-pink-200 focus:border-pink-500"}`}
                    />
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1 ml-1">{errors.email}</p>
                    )}
                  </>
                ) : (
                  <div className="w-full bg-gray-50 border-2 border-gray-100 py-3 px-4 rounded-lg text-gray-600 font-medium">
                    {form.email || "N/A"}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-2">
                  Số điện thoại
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="tel"
                      value={form.phoneNumber || ""}
                      onChange={(e) => handleChange("phoneNumber", e.target.value)}
                      className={`w-full bg-transparent border-b-2 py-3 px-1 outline-none transition-all font-bold text-gray-700
                        ${errors.phoneNumber ? "border-red-400 focus:border-red-500" : "border-pink-200 focus:border-pink-500"}`}
                    />
                    {errors.phoneNumber && (
                      <p className="text-red-400 text-xs mt-1 ml-1">{errors.phoneNumber}</p>
                    )}
                  </>
                ) : (
                  <div className="w-full bg-gray-50 border-2 border-gray-100 py-3 px-4 rounded-lg text-gray-600 font-medium">
                    {form.phoneNumber || "N/A"}
                  </div>
                )}
              </div>

              {/* Role (Read-only) */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-2">
                  Vai trò
                </label>
                <div className="w-full bg-gray-50 border-2 border-gray-100 py-3 px-4 rounded-lg text-gray-600 font-medium">
                  <span className="px-3 py-1 bg-blue-100 text-blue-500 rounded-full text-sm font-bold">
                    {form.role || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting || isCheckingEmail}
                  className="flex-1 px-4 py-3 bg-pink-500 text-white rounded-lg font-bold hover:bg-pink-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isCheckingEmail ? (
                    <><Loader2 size={16} className="animate-spin" /> Đang xác thực email...</>
                  ) : isSubmitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Đang lưu...</>
                  ) : (
                    <><Save size={16} /> Lưu thay đổi</>
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition"
                >
                  Hủy bỏ
                </button>
              </div>
            )}
          </div>

          {/* ── ĐỔI MẬT KHẨU SECTION ── */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
              <div className="flex items-center gap-2">
                <LockKeyhole size={18} className="text-pink-500" />
                <h2 className="text-lg font-bold text-gray-700">Đổi mật khẩu</h2>
              </div>
            </div>

            {/* Banner nhắc nhở nếu đang dùng mật khẩu tạm */}
            {mustChangePassword && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-700">Đổi mật khẩu ngay!</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Bạn đang dùng mật khẩu tạm thời do quản trị viên tạo. Vui lòng đổi ngay để bảo mật tài khoản.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleChangePw} className="space-y-5">
              {/* Mật khẩu cũ */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-2">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input
                    type={showOld ? "text" : "password"}
                    value={pwForm.oldPassword}
                    onChange={(e) => setPwForm(p => ({ ...p, oldPassword: e.target.value }))}
                    placeholder="Nhập mật khẩu hiện tại"
                    className={`w-full pr-10 bg-gray-50 border-2 py-3 px-4 rounded-lg outline-none transition-all text-gray-700 ${
                      pwErrors.oldPassword ? "border-red-300 focus:border-red-500" : "border-gray-100 focus:border-pink-400"
                    }`}
                  />
                  <button type="button" onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500">
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwErrors.oldPassword && <p className="text-red-400 text-xs mt-1 ml-1">{pwErrors.oldPassword}</p>}
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-2">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                    placeholder="≥ 8 ký tự, có cả chữ và số"
                    className={`w-full pr-10 bg-gray-50 border-2 py-3 px-4 rounded-lg outline-none transition-all text-gray-700 ${
                      pwErrors.newPassword ? "border-red-300 focus:border-red-500" : "border-gray-100 focus:border-pink-400"
                    }`}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwErrors.newPassword
                  ? <p className="text-red-400 text-xs mt-1 ml-1">{pwErrors.newPassword}</p>
                  : pwForm.newPassword && (
                    <p className={`text-xs mt-1 ml-1 ${
                      pwForm.newPassword.length >= 8 && /[a-zA-Z]/.test(pwForm.newPassword) && /\d/.test(pwForm.newPassword)
                        ? "text-green-500" : "text-orange-400"
                    }`}>
                      {pwForm.newPassword.length >= 8 && /[a-zA-Z]/.test(pwForm.newPassword) && /\d/.test(pwForm.newPassword)
                        ? "✓ Mật khẩu đạt yêu cầu" : "✗ Cần ≥ 8 ký tự, bao gồm cả chữ và số"}
                    </p>
                  )
                }
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-2">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`w-full pr-10 bg-gray-50 border-2 py-3 px-4 rounded-lg outline-none transition-all text-gray-700 ${
                      pwErrors.confirmPassword ? "border-red-300 focus:border-red-500" : "border-gray-100 focus:border-pink-400"
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500">
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwErrors.confirmPassword
                  ? <p className="text-red-400 text-xs mt-1 ml-1">{pwErrors.confirmPassword}</p>
                  : pwForm.confirmPassword && (
                    <p className={`text-xs mt-1 ml-1 ${
                      pwForm.newPassword === pwForm.confirmPassword ? "text-green-500" : "text-red-400"
                    }`}>
                      {pwForm.newPassword === pwForm.confirmPassword ? "✓ Mật khẩu khớp" : "✗ Mật khẩu không khớp"}
                    </p>
                  )
                }
              </div>

              <button
                type="submit"
                disabled={isChangingPw}
                className="w-full py-3 bg-gradient-to-r from-[#A3437B] to-[#EE4B8E] text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isChangingPw
                  ? <><Loader2 size={16} className="animate-spin" /> Đang cập nhật...</>
                  : <><LockKeyhole size={16} /> Đổi mật khẩu</>
                }
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT - Security Section */}
        <div className="col-span-4 space-y-6">
          {/* Account Info Card */}
          <div className="bg-gradient-to-br from-pink-50 to-orange-50 p-6 rounded-[32px] border border-pink-100 space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-pink-600 uppercase tracking-widest">Thông tin tài khoản</h4>
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <p>
                <span className="font-bold">Ngày tạo:</span>{" "}
                {formatDateVN(user.createdAt, false)}
              </p>
              <p>
                <span className="font-bold">Cập nhật lần cuối:</span>{" "}
                {formatDateVN(user.updatedAt, false)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM MODAL */}
      <ConfirmModal
        open={showConfirm}
        title="Xác nhận cập nhật thông tin?"
        message="Thay đổi sẽ được lưu vào hệ thống. Bạn có chắc chắn muốn tiếp tục?"
        confirmText="Cập nhật"
        cancelText="Hủy"
        isLoading={isSubmitting}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}

export default ProfilePage
