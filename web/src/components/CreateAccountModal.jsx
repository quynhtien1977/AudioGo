import { useState } from "react";
import { Eye as EyeIcon, EyeOff as EyeOffIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { createUserApi } from "@/api/accountApi";
import { isValidEmailFormat, isValidPhone, isEmailDomainValid } from "@/utils/validators";

export default function CreateAccountModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    password: "",
    role: "",
  });

  const [loading, setLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", phone: "" });

  // Auto-generate password = username + phone
  const generatePassword = (username, phone) => {
    if (!username || !phone) return "";
    return `${username}${phone}`;
  };

  const handleChange = (key, value) => {
    setForm((prev) => {
      const updatedForm = { ...prev, [key]: value };

      // Auto-gen password
      if (key === "username" || key === "phone") {
        updatedForm.password = generatePassword(
          updatedForm.username,
          updatedForm.phone
        );
      }

      return updatedForm;
    });

    // Inline validation
    if (key === "email") {
      setErrors((prev) => ({
        ...prev,
        email: value && !isValidEmailFormat(value) ? "Email không đúng định dạng (VD: abc@gmail.com)" : "",
      }));
    }
    if (key === "phone") {
      setErrors((prev) => ({
        ...prev,
        phone: value && !isValidPhone(value) ? "SĐT không hợp lệ. Nhập 10 số bắt đầu bằng 0 (VD: 0901234567)" : "",
      }));
    }
  };

  const handleSubmit = async () => {
    // ── Kiểm tra bắt buộc ──────────────────────────────────────────────
    if (!form.name || !form.email || !form.role || !form.username || !form.phone) {
      toast.error("Vui lòng điền tất cả các trường");
      return;
    }

    // ── Validate format ─────────────────────────────────────────────────
    if (!isValidEmailFormat(form.email)) {
      toast.error("Email không đúng định dạng (VD: abc@gmail.com)");
      return;
    }
    if (!isValidPhone(form.phone)) {
      toast.error("SĐT không hợp lệ. Nhập 10 số bắt đầu bằng 0 (VD: 0901234567)");
      return;
    }

    // ── Verify domain email có thật không (MX lookup) ─────────────────
    setIsCheckingEmail(true);
    try {
      const emailOk = await isEmailDomainValid(form.email);
      if (!emailOk) {
        toast.error("Domain email không tồn tại. Dùng email thực (VD: @gmail.com, @company.vn)");
        return;
      }
    } finally {
      setIsCheckingEmail(false);
    }

    // ── Gọi API ────────────────────────────────────────────────────────
    try {
      setLoading(true);

      const payload = {
        username: form.username,
        password: form.password,
        role: form.role,
        fullName: form.name,
        email: form.email,
        phoneNumber: form.phone,
      };

      const res = await createUserApi(payload);

      toast.success("Tạo tài khoản thành công!");
      onCreated(res);
      onClose();
    } catch (err) {
      const message = err?.response?.data || "Lỗi khi tạo tài khoản";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = "block text-[11px] font-bold text-[#8E707E] mb-2 tracking-widest uppercase ml-1";
  const inputStyle = "w-full px-5 py-3.5 bg-[#FFF0F5] border-none rounded-2xl outline-none text-[#8E707E] placeholder-[#D1B9C5] focus:ring-2 focus:ring-pink-200 transition-all";
  const inputErrorStyle = "w-full px-5 py-3.5 bg-red-50 border-2 border-red-200 rounded-2xl outline-none text-[#8E707E] placeholder-[#D1B9C5] focus:ring-2 focus:ring-red-200 transition-all";

  const isProcessing = loading || isCheckingEmail;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-[500px] rounded-[2.5rem] shadow-2xl p-10 relative">

        <button onClick={onClose} className="absolute top-6 right-8 text-[#D1B9C5] hover:text-[#8E707E]">✕</button>

        <div className="space-y-5">

          {/* HỌ VÀ TÊN */}
          <div>
            <label className={labelStyle}>HỌ VÀ TÊN</label>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={inputStyle}
              placeholder="Nguyen Van A"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className={labelStyle}>Địa chỉ Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={errors.email ? inputErrorStyle : inputStyle}
              placeholder="nguyenvana@example.com"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1 ml-1">{errors.email}</p>
            )}
          </div>

          {/* USERNAME */}
          <div>
            <label className={labelStyle}>Tên đăng nhập</label>
            <input
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              className={inputStyle}
              placeholder="nguyenvana"
            />
          </div>

          {/* SĐT */}
          <div>
            <label className={labelStyle}>Số điện thoại</label>
            <input
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={errors.phone ? inputErrorStyle : inputStyle}
              placeholder="0901234567"
            />
            {errors.phone && (
              <p className="text-red-400 text-xs mt-1 ml-1">{errors.phone}</p>
            )}
          </div>

          {/* MẬT KHẨU */}
          <div>
            <label className={labelStyle}>Mật khẩu (tự động)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                readOnly
                className={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8E707E]"
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
            <p className="text-xs text-[#D1B9C5] mt-1 ml-1 italic">Được tạo tự động từ Username + SĐT</p>
          </div>

          {/* PHÂN QUYỀN */}
          <div>
            <label className={labelStyle}>Phân quyền</label>
            <select
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className={inputStyle}
            >
              <option value="" disabled>Chọn vai trò...</option>
              <option value="Admin">ADMIN</option>
              <option value="Owner">QUẢN LÝ NHÀ HÀNG</option>
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between mt-10 mb-2">
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="flex-1 max-w-[280px] py-4 bg-gradient-to-r from-[#A3437B] via-[#D15993] to-[#F172AC] text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isCheckingEmail ? (
              <><Loader2 size={16} className="animate-spin" /> Xác thực email...</>
            ) : loading ? (
              <><Loader2 size={16} className="animate-spin" /> Đang tạo...</>
            ) : (
              "Tạo Tài Khoản"
            )}
          </button>

          <button
            onClick={onClose}
            className="px-6 py-4 text-[#8E707E] hover:text-[#A3437B] font-medium transition"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}