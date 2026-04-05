import { useState } from "react";
import { createCategoryApi } from "../api/categoryApi";

export default function CreateCategoryModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (value) => {
    setForm({ name: value });
  };

  const handleSubmit = async () => {
    if (!form.name) {
      alert("Vui lòng nhập tên thể loại");
      return;
    }

    try {
      setLoading(true);
      const res = await createCategoryApi(form);
      onCreated(res); // trả data về cho CategoryPage
      onClose();
    } catch (err) {
      alert("Lỗi tạo thể loại");
    } finally {
      setLoading(false);
    }
  };

  // style dùng lại cho gọn
  const labelStyle =
    "block text-[11px] font-bold text-[#8E707E] mb-2 tracking-widest uppercase ml-1";
  const inputStyle =
    "w-full px-5 py-3.5 bg-[#FFF0F5] border-none rounded-2xl outline-none text-[#8E707E] placeholder-[#D1B9C5] focus:ring-2 focus:ring-pink-200 transition-all";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-[500px] rounded-[2.5rem] shadow-2xl p-10 relative">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-8 text-[#D1B9C5] hover:text-[#8E707E]"
        >
          ✕
        </button>

        <div className="space-y-6">
          {/* CATEGORY NAME */}
          <div>
            <label className={labelStyle}>Tên thể loại</label>
            <input
              placeholder="e.g. Food & Drink"
              value={form.name}
              onChange={(e) => handleChange(e.target.value)}
              className={inputStyle}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-between mt-12 mb-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 max-w-[280px] py-4 bg-gradient-to-r from-[#A3437B] via-[#D15993] to-[#F172AC] text-white font-bold rounded-2xl shadow-[0_8px_25px_-5px_rgba(241,114,172,0.6)] hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? "Đang tạo..." : "Tạo thể loại"}
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 text-[#8E707E] font-bold text-sm hover:underline"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}