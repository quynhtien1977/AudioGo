import { useState } from "react"
import { createCategoryApi } from "../api/categoryApi"

export default function CreateCategoryModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (value) => {
    setForm({ name: value })
    setError("")
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Vui lòng nhập tên danh mục")
      return
    }

    try {
      setLoading(true)

      const res = await createCategoryApi({
        name: form.name.trim(),
      })

      // 🔥 BE trả về CategoryDto
      const newCategory = res?.data ?? res

      onCreated?.(newCategory)

      // reset form
      setForm({ name: "" })

      onClose()

    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.message ||
        "Không thể tạo danh mục"
      )
    } finally {
      setLoading(false)
    }
  }

  const labelStyle =
    "block text-[11px] font-bold text-[#8E707E] mb-2 tracking-widest uppercase ml-1"

  const inputStyle =
    "w-full px-5 py-3.5 bg-[#FFF0F5] border-none rounded-2xl outline-none text-[#8E707E] placeholder-[#D1B9C5] focus:ring-2 focus:ring-pink-200"

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white w-full max-w-[500px] rounded-[2.5rem] shadow-2xl p-10 relative">

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-6 right-8 text-[#D1B9C5] hover:text-[#8E707E]"
        >
          ✕
        </button>

        {/* TITLE */}
        <h2 className="text-xl font-bold text-gray-700 mb-6">
          Tạo danh mục mới
        </h2>

        {/* INPUT */}
        <div>
          <label className={labelStyle}>
            Tên danh mục
          </label>

          <input
            placeholder="e.g. Food & Drink"
            value={form.name}
            onChange={(e) => handleChange(e.target.value)}
            className={inputStyle}
          />

          {error && (
            <p className="text-red-500 text-sm mt-2">
              {error}
            </p>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-between mt-10">

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 max-w-[280px] py-4 bg-gradient-to-r from-[#A3437B] via-[#D15993] to-[#F172AC] text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition disabled:opacity-60"
          >
            {loading ? "Đang tạo..." : "Tạo danh mục"}
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
  )
}