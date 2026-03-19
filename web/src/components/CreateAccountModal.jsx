import { useState } from "react";
import { createUserApi } from "../api/accountApi";

export default function CreateAccountModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await createUserApi(form);
      onCreated(res);
      onClose();
    } catch (err) {
      alert("Error creating account");
    } finally {
      setLoading(false);
    }
  };

  // Helper styles để code gọn hơn
  const labelStyle = "block text-[11px] font-bold text-[#8E707E] mb-2 tracking-widest uppercase ml-1";
  const inputStyle = "w-full px-5 py-3.5 bg-[#FFF0F5] border-none rounded-2xl outline-none text-[#8E707E] placeholder-[#D1B9C5] focus:ring-2 focus:ring-pink-200 transition-all";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-[500px] rounded-[2.5rem] shadow-2xl p-10 relative">
        
        {/* Nút X đóng nhanh ở góc nếu cần (tùy chọn) */}
        <button onClick={onClose} className="absolute top-6 right-8 text-[#D1B9C5] hover:text-[#8E707E]">✕</button>

        <div className="space-y-6">
          {/* FULL NAME */}
          <div>
            <label className={labelStyle}>Full Name</label>
            <input
              placeholder="e.g. Elena Rodriguez"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={inputStyle}
            />
          </div>

          {/* EMAIL ADDRESS */}
          <div>
            <label className={labelStyle}>Email Address</label>
            <input
              type="email"
              placeholder="elena.curator@example.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={inputStyle}
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className={labelStyle}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="............"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className={inputStyle}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8E707E] opacity-60 hover:opacity-100 transition-opacity"
              >
                {showPassword ? (
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* ROLE SELECTOR */}
          <div>
            <label className={labelStyle}>Role Selector Dropdown</label>
            <div className="relative">
              <select
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className={`${inputStyle} appearance-none cursor-pointer pr-12`}
              >
                <option value="" disabled>Select user role...</option>
                <option value="ADMIN">ADMIN</option>
                <option value="MANAGER">MANAGER</option>
              </select>
              <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#8E707E]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-[#D1B9C5]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between mt-12 mb-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 max-w-[280px] py-4 bg-gradient-to-r from-[#A3437B] via-[#D15993] to-[#F172AC] text-white font-bold rounded-2xl shadow-[0_8px_25px_-5px_rgba(241,114,172,0.6)] hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#8E707E] font-bold text-sm hover:underline decoration-2 underline-offset-4"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}