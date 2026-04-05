import { useEffect, useState } from "react"
import { Edit3, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

import {
  getCategoriesApi,
  deleteCategoryApi, 
} from "@/api/categoryApi"
import CreateCategoryModal from "@/components/CreateCategoryModal"
import EditCategoryModal from "@/components/EditCategoryModal";


export default function CategoryPage() {
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const pageSize = 5

  useEffect(() => {   
    getCategoriesApi().then(setUsersFromApi => {
      // Giả sử API trả về mảng, ta set vào state
      setCategories(setUsersFromApi)
    })
  }, [])

  // Logic Xóa
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      await deleteCategoryApi(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      
      // Nếu xóa hết data ở trang hiện tại thì lùi lại 1 trang
      if (paginatedData.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    }
  }

  // Phân trang
  const totalPages = Math.ceil(categories.length / pageSize)
  const paginatedData = categories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Grid 5 cột: ID, Name, Created At, Updated At, Action
  const gridLayout = "grid grid-cols-[1.5fr_3fr_2fr_2fr_1fr]"

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">QUẢN LÝ THỂ LOẠI</h1>
          <p className="text-gray-500 text-sm">Tổ chức và quản lý thể loại POI</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all active:scale-95"
        >
          + Thêm thể loại mới
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className={`${gridLayout} px-8 py-4 text-[11px] font-bold text-pink-400 border-b tracking-widest uppercase bg-gray-50/50`}>
          <span>ID</span>
          <span>Tên thể loại</span>
          <span>Ngày tạo</span>
          <span>Ngày cập nhật</span>
          <span className="text-right">Hành động</span>
        </div>

        <div className="divide-y divide-gray-50">
          {paginatedData.map((c) => (
            <div
              key={c.id}
              className={`${gridLayout} px-8 py-5 items-center hover:bg-pink-50/20 transition-colors`}
            >
              <div className="text-xs font-mono text-gray-400 font-medium">{c.id}</div>
              <div className="font-bold text-gray-700 text-sm">{c.name}</div>
              <div className="text-sm text-gray-500">
                {new Date(c.createdAt).toLocaleDateString()}
              </div>

              <div className="text-sm text-gray-500">
                {new Date(c.updatedAt).toLocaleDateString()}
              </div>

              <div className="flex justify-end gap-3">
                {/* NÚT SỬA */}
                <button 
                  onClick={() => setEditingCategory(c)}
                  className="p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-500 rounded-lg transition-all"
                  title="Edit Category"
                >
                  <Edit3 size={18} />
                </button>

                {/* NÚT XÓA */}
                <button 
                  onClick={() => handleDelete(c.id)}
                  className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                  title="Delete Category"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          
          {categories.length === 0 && (
            <div className="p-10 text-center text-gray-400 italic">No categories found.</div>
          )}
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center px-8 py-5 text-sm text-gray-500 bg-gray-50/30">
          <p className="font-medium">
            Hiển thị <span className="text-gray-800">{(currentPage - 1) * pageSize + 1}</span> -{" "}
            <span className="text-gray-800">{Math.min(currentPage * pageSize, categories.length)}</span> của   {categories.length}
          </p>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 border rounded-lg hover:bg-pink-500 hover:text-white disabled:opacity-50"
            >
              <ChevronLeft size={14} />
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-lg ${
                  currentPage === i + 1
                    ? "bg-pink-500 text-white shadow-md shadow-pink-200"
                    : "text-gray-500 hover:bg-white hover:border-gray-200 border border-transparent"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 border rounded-lg hover:bg-pink-500 hover:text-white disabled:opacity-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        
      </div>

      {/* CREATE CATEGORY MODAL */}
      {showModal && (
        <CreateCategoryModal
          onClose={() => setShowModal(false)}
          onCreated={(newCategory) => {
            setCategories((prev) => [newCategory, ...prev]);
          }}
        />
      )}

      {/* EDIT CATEGORY MODAL */}
      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onUpdated={(updated) => {
            setCategories((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c))
            );
          }}
        />
      )}

    </div>

    
  )
}