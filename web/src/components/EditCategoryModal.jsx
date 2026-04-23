import { useEffect, useState } from "react"
import { updateCategoryApi } from "@/api/categoryApi"

export default function EditCategoryModal({
  category,
  onClose,
  onUpdated
}) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // 🔥 sync khi mở modal / đổi category
  useEffect(() => {
    if (category) {
      setName(category.name || "")
      setError("")
    }
  }, [category])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Vui lòng nhập tên danh mục")
      return
    }

    try {
      setLoading(true)

      const res = await updateCategoryApi(
        category.categoryId, // 🔥 FIX ID
        { name: name.trim() }
      )

      const updated = res?.data ?? res

      onUpdated?.(updated)
      onClose()

    } catch (err) {
      console.error(err)

      setError(
        err?.response?.data?.message ||
        "Lỗi cập nhật danh mục"
      )

    } finally {
      setLoading(false)
    }
  }

  const labelStyle =
    "block text-[11px] font-bold text-[#8E707E] mb-2 tracking-widest uppercase ml-1"

  const inputStyle =
    "w-full px-5 py-3.5 bg-[#FFF0F5] rounded-2xl outline-none text-[#8E707E] placeholder-[#D1B9C5] focus:ring-2 focus:ring-pink-200 transition-all"

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
          Cập nhật danh mục
        </h2>

        {/* INPUT */}
        <div>
          <label className={labelStyle}>
            Tên danh mục
          </label>

          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError("")
            }}
            className={inputStyle}
            placeholder="Nhập tên danh mục"
          />

          {error && (
            <p className="text-red-500 text-sm mt-2">
              {error}
            </p>
          )}
        </div>

        {/* ACTION */}
        <div className="flex items-center justify-between mt-10">

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 max-w-[280px] py-4 bg-gradient-to-r from-[#A3437B] via-[#D15993] to-[#F172AC] text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition disabled:opacity-60"
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
  )
}