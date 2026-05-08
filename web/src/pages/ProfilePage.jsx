import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Save, CornerDownLeft, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

import ConfirmModal from "@/components/ConfirmModal"
import { getUserByIdApi, updateMyProfileApi } from "@/api/accountApi"
import { isValidEmailFormat, isValidPhone, isEmailDomainValid } from "@/utils/validators"
import useAuth from "@/hooks/useAuth"

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
    setForm(user) // reset về data ban đầu
    setErrors({ email: "", phoneNumber: "" })
  }

  if (loading) return <div className="p-6">Loading...</div>
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
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "N/A"}
              </p>
              <p>
                <span className="font-bold">Cập nhật lần cuối:</span>{" "}
                {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString("vi-VN") : "N/A"}
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
