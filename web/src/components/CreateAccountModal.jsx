import { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { createUserApi } from "@/api/accountApi";
import { isValidEmailFormat, isValidPhone, isEmailDomainValid } from "@/utils/validators";

export default function CreateAccountModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    role: "Owner",
  });

  const [loading, setLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [errors, setErrors] = useState({ email: "", phone: "" });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));

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

    // ── Gọi API ─────────────────────────────────────────────────────────
    try {
      setLoading(true);

      const payload = {
        username: form.username,
        role: form.role,
        fullName: form.name,
        email: form.email,
        phoneNumber: form.phone,
      };

      const res = await createUserApi(payload);

      // Hiện cảnh báo email nếu có
      if (res?.emailWarning) {
        toast.error(res.emailWarning, { duration: 6000 });
      } else {
        toast.success(`Mật khẩu tạm đã được gửi tới email ${form.email}`);
      }

      onCreated(res?.account ?? res);
      onClose();
    } catch (err) {
      const message = err?.response?.data || err || "Lỗi khi tạo tài khoản";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = "block text-[11px] font-bold text-[#8E707E] mb-2 tracking-widest uppercase ml-1";
  const inputStyle = "w-full px-5 py-3.5 bg-[#FFF0F5] border-none rounded-2xl outline-none text-[#8E707E] placeholder-[#D1B9C5] focus:ring-2 focus:ring-pink-200 transition-all";
  const inputErrorStyle = "w-full px-5 py-3.5 bg-red-50 border-2 border-red-200 rounded-2xl outline-none text-[#8E707E] placeholder-[#D1B9C5] focus:ring-2 focus:ring-red-200 transition-all";

  const isProcessing = loading || isCheckingEmail;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

          {/* MẬt khẩu sẽ được sinh tự động và gửi qua email */}
          <div className="flex items-center gap-2 bg-[#FFF0F5] rounded-2xl px-5 py-3.5">
            <Mail size={20} className="text-[#EE4B8E] flex-shrink-0" />
            <p className="text-[13px] text-[#8E707E]">
              Mật khẩu tạm thời sẽ được tự động sinh và gửi
              thông <strong>qua email</strong> sau khi tạo tài khoản.
            </p>
          </div>

          {/* PHÂN QUYỀN */}
          <div>
            <label className={labelStyle}>Phân quyền</label>
            <select
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className={inputStyle}
            >
              <option value="Owner">QUẢN LÝ NHÀ HÀNG</option>
              <option value="Admin">ADMIN</option>
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
    </div>,
    document.body
  );
}