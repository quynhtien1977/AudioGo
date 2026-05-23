import { useState, useEffect } from "react"
import { getArticleById, createArticle, updateArticle } from "../api/articleApi"
import { uploadImage } from "../api/mediaApi"
import { Image, Upload, X, Loader2 } from "lucide-react"

export default function ArticleFormModal({ articleId, onClose, onSaved }) {
  const [form, setForm] = useState({
    type: "tip",
    imageUrl: "",
    isActive: true,
    sortOrder: 1,
    title: "",
    summary: "",
    body: "",
  })

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (articleId) {
      fetchArticleDetails()
    }
  }, [articleId])

  const fetchArticleDetails = async () => {
    try {
      setFetching(true)
      const data = await getArticleById(articleId)
      const viContent = data.contents?.vi || { title: "", summary: "", body: "" }
      setForm({
        type: data.type || "tip",
        imageUrl: data.imageUrl || "",
        isActive: data.isActive !== false,
        sortOrder: data.sortOrder || 1,
        title: viContent.title || "",
        summary: viContent.summary || "",
        body: viContent.body || "",
      })
    } catch (err) {
      console.error(err)
      setError("Không thể tải chi tiết bài viết")
    } finally {
      setFetching(false)
    }
  }

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploading(true)
      setError("")
      // Đẩy ảnh lên Azure Blob với folder tương ứng (tips hoặc news)
      const folderName = form.type === "tip" ? "tips" : "news"
      const url = await uploadImage(file, folderName)
      setForm((prev) => ({ ...prev, imageUrl: url }))
    } catch (err) {
      console.error(err)
      setError("Tải ảnh lên thất bại")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Vui lòng nhập tiêu đề bài viết")
      return
    }
    if (!form.summary.trim()) {
      setError("Vui lòng nhập tóm tắt ngắn")
      return
    }
    if (!form.body.trim()) {
      setError("Vui lòng nhập nội dung chi tiết bài viết")
      return
    }
    if (!form.imageUrl.trim()) {
      setError("Vui lòng tải lên ảnh bìa bài viết")
      return
    }

    const sortVal = parseInt(form.sortOrder, 10)
    if (isNaN(sortVal) || sortVal <= 0) {
      setError("Thứ tự hiển thị phải lớn hơn 0")
      return
    }

    try {
      setLoading(true)
      setError("")

      const payload = {
        type: form.type,
        imageUrl: form.imageUrl,
        isActive: form.isActive,
        sortOrder: sortVal,
        contents: {
          vi: {
            title: form.title.trim(),
            summary: form.summary.trim(),
            body: form.body.trim(),
          },
        },
      }

      if (articleId) {
        await updateArticle(articleId, payload)
      } else {
        await createArticle(payload)
      }

      onSaved?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError(err?.response?.data || "Đã xảy ra lỗi khi lưu bài viết")
    } finally {
      setLoading(false)
    }
  }

  const labelStyle =
    "block text-[11px] font-bold text-[#8E707E] mb-1.5 tracking-widest uppercase ml-1"

  const inputStyle =
    "w-full px-4 py-3 bg-[#FFF0F5] border-none rounded-xl outline-none text-[#5C4550] placeholder-[#D1B9C5] focus:ring-2 focus:ring-pink-200 transition-all font-medium text-sm"

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-[700px] max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative animate-scaleIn">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-5 right-6 p-2 rounded-full text-[#D1B9C5] hover:text-[#8E707E] hover:bg-pink-50 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* HEADER */}
        <div className="p-6 pb-4 border-b border-pink-50">
          <h2 className="text-xl font-bold text-gray-800">
            {articleId ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Quản lý thông tin Mẹo Du Lịch hoặc Tin Tức được hiển thị trên mobile.
          </p>
        </div>

        {fetching ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-pink-500">
            <Loader2 className="animate-spin mb-3" size={32} />
            <p className="text-sm font-medium">Đang tải dữ liệu bài viết...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LOẠI BÀI VIẾT */}
              <div>
                <label className={labelStyle}>Phân loại bài viết</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange("type", "tip")}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                      form.type === "tip"
                        ? "bg-pink-500 text-white shadow-md shadow-pink-200"
                        : "bg-[#FFF0F5] text-[#8E707E] hover:bg-pink-100"
                    }`}
                  >
                    Mẹo Du Lịch (Tip)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange("type", "news")}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                      form.type === "news"
                        ? "bg-pink-500 text-white shadow-md shadow-pink-200"
                        : "bg-[#FFF0F5] text-[#8E707E] hover:bg-pink-100"
                    }`}
                  >
                    Tin Tức (News)
                  </button>
                </div>
              </div>

              {/* THỨ TỰ SẮP XẾP */}
              <div>
                <label className={labelStyle}>Thứ tự hiển thị (Tùy chỉnh)</label>
                <input
                  type="number"
                  min="1"
                  value={form.sortOrder}
                  onChange={(e) => handleInputChange("sortOrder", e.target.value)}
                  className={inputStyle}
                  placeholder="1 (Độ ưu tiên cao nhất)"
                />
              </div>
            </div>

            {/* TIÊU ĐỀ */}
            <div>
              <label className={labelStyle}>Tiêu đề (Tiếng Việt)</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={inputStyle}
                placeholder="Nhập tiêu đề hấp dẫn..."
              />
            </div>

            {/* TÓM TẮT NGẮN */}
            <div>
              <label className={labelStyle}>Tóm tắt ngắn (Tiếng Việt)</label>
              <textarea
                rows="2"
                value={form.summary}
                onChange={(e) => handleInputChange("summary", e.target.value)}
                className={`${inputStyle} resize-none`}
                placeholder="Tóm tắt ngắn gọn hiển thị trên danh sách..."
              />
            </div>

            {/* NỘI DUNG CHI TIẾT (PLAIN TEXT) */}
            <div>
              <label className={labelStyle}>Nội dung chi tiết (Tiếng Việt - Plain Text)</label>
              <textarea
                rows="6"
                value={form.body}
                onChange={(e) => handleInputChange("body", e.target.value)}
                className={`${inputStyle} font-mono text-xs`}
                placeholder="Nhập nội dung đầy đủ của bài viết..."
              />
            </div>

            {/* COVER IMAGE */}
            <div>
              <label className={labelStyle}>Ảnh bìa bài viết</label>
              <div className="mt-1 flex flex-col md:flex-row gap-4 items-start">
                {form.imageUrl ? (
                  <div className="relative w-full md:w-48 h-32 rounded-2xl overflow-hidden border border-pink-100 group shadow-sm">
                    <img
                      src={form.imageUrl}
                      alt="Cover"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <button
                      type="button"
                      onClick={() => handleInputChange("imageUrl", "")}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs gap-1"
                    >
                      <X size={16} /> Xóa ảnh
                    </button>
                  </div>
                ) : (
                  <label className="flex-1 w-full flex flex-col items-center justify-center py-8 border-2 border-dashed border-[#E9C3D5] hover:border-pink-400 bg-[#FFF5F8]/40 hover:bg-[#FFF5F8]/80 rounded-2xl cursor-pointer transition-all group">
                    {uploading ? (
                      <Loader2 className="animate-spin text-pink-500 mb-2" size={24} />
                    ) : (
                      <Upload className="text-[#8E707E] group-hover:text-pink-500 group-hover:scale-110 transition-all mb-2" size={24} />
                    )}
                    <span className="text-xs font-bold text-[#8E707E] group-hover:text-pink-600">
                      {uploading ? "Đang tải ảnh lên..." : "Tải ảnh bìa lên (PNG, JPG, WEBP)"}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">
                      Ảnh sẽ tự động đẩy lên thư mục /{form.type === "tip" ? "tips" : "news"} của Blob Storage
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* TRẠNG THÁI ACTIVE */}
            <div className="flex items-center justify-between p-4 bg-pink-50/50 rounded-2xl border border-pink-100/50">
              <div>
                <h4 className="text-sm font-bold text-gray-700">Trạng thái kích hoạt</h4>
                <p className="text-xs text-gray-400">Ẩn hoặc hiển thị bài viết này trên ứng dụng di động.</p>
              </div>
              <button
                type="button"
                onClick={() => handleInputChange("isActive", !form.isActive)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.isActive ? "bg-pink-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="p-6 border-t border-pink-50 flex items-center justify-end gap-3 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-5 py-3 text-[#8E707E] font-bold text-sm hover:underline"
            disabled={loading}
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || uploading || fetching}
            className="px-8 py-3 bg-gradient-to-r from-[#A3437B] via-[#D15993] to-[#F172AC] text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading ? "Đang lưu..." : articleId ? "Lưu thay đổi" : "Đăng bài viết"}
          </button>
        </div>

      </div>
    </div>
  )
}
