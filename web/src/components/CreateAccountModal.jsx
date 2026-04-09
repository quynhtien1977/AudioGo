  import { useState } from "react";
  import { Eye as EyeIcon, EyeOff as EyeOffIcon } from "lucide-react";
  import { createUserApi } from "@/api/accountApi";

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
  const [showPassword, setShowPassword] = useState(false);

  // ✅ FIX: password = username + phone
  const generatePassword = (username, phone) => {
    if (!username || !phone) return "";
    return `${username}${phone}`;
  };

  const handleChange = (key, value) => {
    setForm((prev) => {
      const updatedForm = { ...prev, [key]: value };

      // ✅ FIX logic generate password
      if (key === "username" || key === "phone") {
        updatedForm.password = generatePassword(
          updatedForm.username,
          updatedForm.phone
        );
      }

      return updatedForm;
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.role || !form.username || !form.phone) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      // ✅ FIX: mapping đúng DTO backend
      const payload = {
        username: form.username,
        password: form.password,
        role: form.role,
        fullName: form.name,          // FIX
        email: form.email,
        phoneNumber: form.phone,      // FIX
      };

      const res = await createUserApi(payload);

      onCreated(res);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error creating account");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = "block text-[11px] font-bold text-[#8E707E] mb-2 tracking-widest uppercase ml-1";
  const inputStyle = "w-full px-5 py-3.5 bg-[#FFF0F5] border-none rounded-2xl outline-none text-[#8E707E] placeholder-[#D1B9C5] focus:ring-2 focus:ring-pink-200 transition-all";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-[500px] rounded-[2.5rem] shadow-2xl p-10 relative">
        
        <button onClick={onClose} className="absolute top-6 right-8 text-[#D1B9C5] hover:text-[#8E707E]">✕</button>

        <div className="space-y-6">

          <div>
            <label className={labelStyle}>HỌ VÀ TÊN </label>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={inputStyle}
              placeholder="Nguyen Van A"
            />
          </div>

          <div>
            <label className={labelStyle}>Địa chỉ Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={inputStyle}
              placeholder="nguyenvana@example.com"
            />
          </div>

          <div>
            <label className={labelStyle}>Tên đăng nhập</label>
            <input
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              className={inputStyle}
              placeholder="nguyenvana"
            />
          </div>

          <div>
            <label className={labelStyle}>Số điện thoại</label>
            <input
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={inputStyle}
              placeholder="0123456789"
            />
          </div>

          <div>
            <label className={labelStyle}>Mật khẩu</label>
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
          </div>

          <div>
            <label className={labelStyle}>Phân quyền</label>
            <select
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className={`${inputStyle}`}
            >
              <option value="" disabled>Chọn vai trò...</option>
              <option value="Admin">ADMIN</option>   
              <option value="Owner">QUẢN LÝ NHÀ HÀNG</option> 
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between mt-12 mb-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 max-w-[280px] py-4 bg-gradient-to-r from-[#A3437B] via-[#D15993] to-[#F172AC] text-white font-bold rounded-2xl"
          >
            {loading ? "Đang tạo..." : "Tạo Tài Khoản"}
          </button>
          
          <button onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}