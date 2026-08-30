import { useEffect, useState, useContext } from "react"
import { Edit3, Trash2, ChevronLeft, ChevronRight, Layers } from "lucide-react"
import PageLoader from "@/components/PageLoader"
import toast from "react-hot-toast"
import PageHeader from "@/components/PageHeader"
import { SimpleTooltip } from "@/components/ui/tooltip"

import {
  getCategoriesApi,
  deleteCategoryApi,
} from "@/api/categoryApi"

import CreateCategoryModal from "@/components/CreateCategoryModal"
import EditCategoryModal from "@/components/EditCategoryModal"
import ConfirmModal from "@/components/ConfirmModal"
import EmptyState from "@/components/EmptyState"
import { SearchContext } from "@/context/SearchContext"
import { formatDateVN } from "@/utils/formatDate"

export default function CategoryPage() {
  const { searchFilter } = useContext(SearchContext)
  const [categories, setCategories] = useState([])
  const [filteredCategories, setFilteredCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [loading, setLoading] = useState(false)

  const pageSize = 5

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await getCategoriesApi()

        // ✅ handle cả 2 kiểu BE trả về
        const data = Array.isArray(res) ? res : res?.data || []

        setCategories(data)
      } catch (err) {
        console.error("Load categories error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // SEARCH FILTERING EFFECT
  useEffect(() => {
    if (searchFilter?.pageType === "category" && searchFilter?.query) {
      const searchTerm = searchFilter.query.toLowerCase()
      const filtered = categories.filter((cat) =>
        cat.name?.toLowerCase().includes(searchTerm)
      )
      setFilteredCategories(filtered)
      setCurrentPage(1) // Reset to first page
    } else {
      setFilteredCategories(categories)
    }
  }, [searchFilter, categories])

  const openDeleteConfirm = (id) => {
    setSelectedCategoryId(id)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    try {
      await deleteCategoryApi(selectedCategoryId)

      setCategories(prev =>
        prev.filter(c => c.categoryId !== selectedCategoryId)
      )

      toast.success("Xóa danh mục thành công")

      if (paginatedData.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    } catch (err) {
      console.error(err)
      if (err.response?.status === 409) {
        toast.error(err.response.data || "Danh mục đang có POI liên kết, không thể xóa.")
      } else {
        toast.error("Xóa danh mục thất bại")
      }
    }

    setShowDeleteModal(false)
  }

  const displayData = filteredCategories
  const totalPages = Math.ceil(displayData.length / pageSize)

  const paginatedData = displayData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const gridLayout = "grid grid-cols-[2fr_2fr_2fr_1fr] items-center"

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <PageHeader
        title="QUẢN LÝ DANH MỤC"
        description="Tổ chức và quản lý danh mục POI"
        icon={<Layers size={24} />}
        actionButton={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-pink-100 hover:shadow-lg transition-all text-sm animate-fadeIn"
          >
            + Thêm danh mục mới
          </button>
        }
      />

      {/* TABLE */}
      {loading ? (
        <PageLoader text="Đang tải dữ liệu danh mục..." />
      ) : paginatedData.length === 0 ? (
        <EmptyState
          icon={<Layers size={40} />}
          title="Không tìm thấy danh mục nào"
          description="Thử thay đổi từ khóa tìm kiếm hoặc tạo một danh mục mới để bắt đầu liên kết POI."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-pink-100/30 shadow-sm overflow-hidden animate-fadeIn">
          {/* HEADER ROW */}
          <div className={`${gridLayout} px-8 py-4 text-[11px] font-bold text-pink-500 tracking-wider uppercase border-b bg-pink-50/20`}>
            <span>Tên danh mục</span>
            <span>Ngày tạo</span>
            <span>Ngày cập nhật</span>
            <span className="text-right">Hành động</span>
          </div>

          {/* BODY */}
          <div className="divide-y">
            {paginatedData.map((c) => (
              <div
                key={c.categoryId}
                className={`${gridLayout} px-8 py-4 hover:bg-pink-50/20 transition-colors`}
              >
                {/* NAME */}
                <div className="font-bold text-gray-700 truncate">{c.name}</div>

                {/* CREATED */}
                <div className="text-sm text-gray-500 truncate">{formatDateVN(c.createdAt, false)}</div>

                {/* UPDATED */}
                <div className="text-sm text-gray-500 truncate">{formatDateVN(c.updatedAt, false)}</div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-2">
                  <SimpleTooltip content="Chỉnh sửa danh mục">
                    <button
                      onClick={() => setEditingCategory(c)}
                      className="p-2 rounded-xl text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Edit3 size={16} />
                    </button>
                  </SimpleTooltip>

                  <SimpleTooltip content="Xóa danh mục này">
                    <button
                      onClick={() => openDeleteConfirm(c.categoryId)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Xóa danh mục"
                    >
                      <Trash2 size={16} />
                    </button>
                  </SimpleTooltip>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 0 && (
            <div className="flex justify-between px-8 py-4 text-sm text-gray-500 items-center bg-gray-50/50">
              <p>Hiển thị {paginatedData.length} / {displayData.length} danh mục</p>

              <div className="flex gap-1 items-center">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className={`p-2 rounded-full ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-pink-500 hover:bg-pink-50 transition cursor-pointer"}`}
                  title="Trang trước"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(i => i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1))
                  .reduce((acc, curr, idx, arr) => {
                    if (idx > 0 && curr - arr[idx - 1] > 1) acc.push('...');
                    acc.push(curr);
                    return acc;
                  }, [])
                  .map((p, idx) => (
                    p === '...' ? (
                      <span key={`dots-${idx}`} className="px-2 text-gray-400">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer ${currentPage === p ? "bg-pink-500 text-white shadow-sm" : "hover:bg-pink-50 hover:text-pink-600"}`}
                        title={`Trang ${p}`}
                      >
                        {p}
                      </button>
                    )
                  ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className={`p-2 rounded-full ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-pink-500 hover:bg-pink-50 transition cursor-pointer"}`}
                  title="Trang tiếp theo"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {showModal && (
        <CreateCategoryModal
          onClose={() => setShowModal(false)}
          onCreated={(newCategory) => setCategories((prev) => [newCategory, ...prev])}
        />
      )}

      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onUpdated={(updated) => {
            setCategories((prev) =>
              prev.map((c) =>
                c.categoryId === updated.categoryId
                  ? {
                      ...c,
                      name: updated.name,
                      updatedAt: updated.updatedAt || new Date().toISOString(),
                    }
                  : c
              )
            );
          }}
        />
      )}

      {showDeleteModal && (
      <ConfirmModal
        open={showDeleteModal}
        title="Xác nhận xóa danh mục?"
        message="Bạn có chắc chắn muốn xóa danh mục này không? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    )}
    </div>
  )
}