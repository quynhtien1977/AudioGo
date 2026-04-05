import { useState } from "react";
import { updateCategoryApi } from "@/api/categoryApi";

export default function EditCategoryModal({ category, onClose, onUpdated }) {
  const [name, setName] = useState(category.name);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Vui lòng nhập tên thể loại");
      return;
    }

    try {
      setLoading(true);

      const updated = await updateCategoryApi(category.id, {
        name,
      });

      onUpdated(updated); // trả data về page cha
      onClose();
    } catch (err) {
      alert("Lỗi cập nhật thể loại");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle =
    "block text-[11px] font-bold text-[#8E707E] mb-2 tracking-widest uppercase ml-1";

  const inputStyle =
    "w-full px-5 py-3.5 bg-[#FFF0F5] rounded-2xl outline-none text-[#8E707E] placeholder-[#D1B9C5] focus:ring-2 focus:ring-pink-200 transition-all";

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
          <div>
            <label className={labelStyle}>Tên thể loại</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputStyle}
            />
          </div>
        </div>

        {/* ACTION */}
        <div className="flex items-center justify-between mt-12">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 max-w-[280px] py-4 bg-gradient-to-r from-[#A3437B] via-[#D15993] to-[#F172AC] text-white font-bold rounded-2xl shadow-[0_8px_25px_-5px_rgba(241,114,172,0.6)] hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? "Đang cập nhật..." : "Cập nhật"}
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