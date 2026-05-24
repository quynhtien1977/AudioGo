import { useState, useEffect } from "react"
import { getAllArticles, deleteArticle, updateArticle } from "../api/articleApi"
import ArticleFormModal from "../components/ArticleFormModal"
import StatsCard from "@/components/StatsCard"
import PageHeader from "@/components/PageHeader"
import {
  Newspaper,
  Compass,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Sliders,
  Calendar,
  AlertCircle,
  TrendingUp,
} from "lucide-react"

export default function ArticlesPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("") // "" for all, "tip", "news"
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedArticleId, setSelectedArticleId] = useState(null)
  
  // States for Confirm Deletion
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Success/Error notifications
  const [notification, setNotification] = useState({ message: "", type: "" })

  const showToast = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification({ message: "", type: "" }), 3000)
  }

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
      setLoading(true)
      const data = await getAllArticles()
      setArticles(data || [])
    } catch (err) {
      console.error(err)
      showToast("Không thể tải danh sách bài viết", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    try {
      setDeleting(true)
      await deleteArticle(confirmDeleteId)
      showToast("Xóa bài viết thành công")
      setArticles((prev) => prev.filter((a) => a.articleId !== confirmDeleteId))
      setConfirmDeleteId(null)
    } catch (err) {
      console.error(err)
      showToast("Xóa bài viết thất bại", "error")
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleActive = async (article) => {
    try {
      const payload = {
        type: article.type,
        imageUrl: article.imageUrl,
        isActive: !article.isActive,
        sortOrder: article.sortOrder,
        contents: {
          vi: {
            title: article.title,
            summary: article.summary,
            body: article.body || "",
          },
        },
      }
      const updated = await updateArticle(article.articleId, payload)
      
      setArticles((prev) =>
        prev.map((a) =>
          a.articleId === article.articleId ? { ...a, isActive: updated.isActive } : a
        )
      )
      showToast(`Đã ${updated.isActive ? "kích hoạt" : "ẩn"} bài viết`)
    } catch (err) {
      console.error(err)
      showToast("Không thể cập nhật trạng thái", "error")
    }
  }

  // Filters articles locally
  const filteredArticles = articles.filter((article) => {
    const matchesType = !filterType || article.type === filterType
    const matchesSearch =
      article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  // Count metrics
  const totalCount = articles.length
  const tipsCount = articles.filter((a) => a.type === "tip").length
  const newsCount = articles.filter((a) => a.type === "news").length
  const activeCount = articles.filter((a) => a.isActive).length

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER SECTION */}
      <PageHeader
        title="QUẢN LÝ BÀI VIẾT"
        description="Đăng tải, sắp xếp và phân loại tin tức & mẹo du lịch cho du khách ứng dụng AudioGo."
        icon={<Newspaper size={24} />}
        actionButton={
          <button
            onClick={() => {
              setSelectedArticleId(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-pink-100 hover:shadow-lg transition-all text-sm self-start md:self-auto"
          >
            <Plus size={18} />
            Tạo bài viết mới
          </button>
        }
      />

      {/* NOTIFICATION TOAST */}
      {notification.message && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-slideIn ${
            notification.type === "error"
              ? "bg-red-50 text-red-800 border border-red-100"
              : "bg-pink-50 text-pink-800 border border-pink-100"
          }`}
        >
          <AlertCircle size={18} />
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="TỔNG BÀI VIẾT"
          value={totalCount}
          sub={`${activeCount} đang hiển thị`}
          icon={<Newspaper size={20} />}
        />
        <StatsCard
          title="MẸO DU LỊCH"
          value={tipsCount}
          sub="Tips du lịch nổi bật"
          color="text-emerald-600"
          icon={<Compass size={20} />}
        />
        <StatsCard
          title="TIN TỨC & SỰ KIỆN"
          value={newsCount}
          sub="News & sự kiện hot"
          color="text-blue-600"
          icon={<TrendingUp size={20} />}
        />
        <StatsCard
          title="ẨN KHỎI MOBILE"
          value={totalCount - activeCount}
          sub="Đang lưu dưới dạng bản nháp"
          color="text-amber-600"
          icon={<EyeOff size={20} />}
        />
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-5 rounded-[2rem] border border-pink-50/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* TABS */}
          <div className="flex bg-[#FFF0F5] p-1 rounded-2xl gap-1 self-start">
            <button
              onClick={() => setFilterType("")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filterType === ""
                  ? "bg-white text-pink-600 shadow-sm"
                  : "text-[#8E707E] hover:text-pink-600"
              }`}
            >
              Tất cả ({totalCount})
            </button>
            <button
              onClick={() => setFilterType("tip")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filterType === "tip"
                  ? "bg-white text-pink-600 shadow-sm"
                  : "text-[#8E707E] hover:text-pink-600"
              }`}
            >
              Mẹo Du Lịch ({tipsCount})
            </button>
            <button
              onClick={() => setFilterType("news")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filterType === "news"
                  ? "bg-white text-pink-600 shadow-sm"
                  : "text-[#8E707E] hover:text-pink-600"
              }`}
            >
              Tin Tức ({newsCount})
            </button>
          </div>

          {/* SEARCH BAR */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D1B9C5]" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm tiêu đề hoặc nội dung tóm tắt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#FFF0F5] border-none rounded-2xl outline-none text-[#8E707E] placeholder-[#D1B9C5] focus:ring-2 focus:ring-pink-200 transition-all font-medium text-xs"
            />
          </div>

        </div>

        {/* ARTICLES TABLE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-pink-500">
            <Loader2 className="animate-spin mb-3" size={32} />
            <p className="text-sm font-semibold">Đang tải dữ liệu bài viết...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Newspaper size={48} className="text-pink-200 mb-3" />
            <h3 className="text-base font-bold text-gray-700">Không tìm thấy bài viết nào</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              Thử thay đổi bộ lọc hoặc tạo bài viết mới để bắt đầu hiển thị thông tin lên mobile.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-pink-50 text-[10px] uppercase tracking-wider text-[#8E707E] font-bold">
                  <th className="pb-3 pl-2">Ảnh / Phân loại</th>
                  <th className="pb-3">Tiêu đề & Tóm tắt</th>
                  <th className="pb-3 text-center">Độ ưu tiên</th>
                  <th className="pb-3 text-center">Ngày đăng</th>
                  <th className="pb-3 text-center">Hiển thị</th>
                  <th className="pb-3 pr-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50/50">
                {filteredArticles.map((article) => (
                  <tr key={article.articleId} className="group hover:bg-pink-50/20 transition-colors">
                    {/* COVER IMAGE & TYPE BADGE */}
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-xl overflow-hidden bg-pink-100/50 flex-shrink-0 relative border border-pink-50">
                          {article.imageUrl ? (
                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-pink-300">
                              <Newspaper size={18} />
                            </div>
                          )}
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            article.type === "tip"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}
                        >
                          {article.type === "tip" ? "Mẹo Du Lịch" : "Tin Tức"}
                        </span>
                      </div>
                    </td>

                    {/* TITLE & SUMMARY */}
                    <td className="py-4 max-w-sm lg:max-w-md">
                      <h4 className="text-sm font-bold text-gray-700 line-clamp-1 group-hover:text-pink-600 transition-colors">
                        {article.title}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                        {article.summary}
                      </p>
                    </td>

                    {/* SORT ORDER */}
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 bg-pink-50 text-pink-600 rounded-lg text-xs font-bold border border-pink-100/50">
                        <Sliders size={12} className="mr-1" />
                        {article.sortOrder}
                      </span>
                    </td>

                    {/* PUBLISHED DATE */}
                    <td className="py-4 text-center text-xs text-gray-400 font-medium">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar size={12} />
                        {new Date(article.publishedAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </div>
                    </td>

                    {/* ACTIVE TOGGLE */}
                    <td className="py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(article)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          article.isActive
                            ? "bg-pink-500/10 text-pink-600 border-pink-200"
                            : "bg-gray-100 text-gray-400 border-gray-200"
                        }`}
                      >
                        {article.isActive ? (
                          <>
                            <Eye size={12} />
                            Đang Hiện
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} />
                            Đang Ẩn
                          </>
                        )}
                      </button>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 pr-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedArticleId(article.articleId)
                            setIsModalOpen(true)
                          }}
                          className="p-2 rounded-xl text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(article.articleId)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Xóa bài viết"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-[400px] rounded-[2rem] shadow-2xl p-8 relative animate-scaleIn">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Xác nhận xóa bài viết</h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa bài viết này không? Hành động này sẽ gỡ bài viết vĩnh viễn khỏi hệ thống di động và không thể khôi phục lại.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-[#8E707E] font-bold text-xs hover:underline"
                disabled={deleting}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-colors text-xs flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="animate-spin" size={14} />}
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {isModalOpen && (
        <ArticleFormModal
          articleId={selectedArticleId}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedArticleId(null)
          }}
          onSaved={loadArticles}
        />
      )}
    </div>
  )
}
