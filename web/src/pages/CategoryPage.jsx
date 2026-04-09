import { useEffect, useState } from "react"
import { Edit3, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

import {
  getCategoriesApi,
  deleteCategoryApi,
} from "@/api/categoryApi"

import CreateCategoryModal from "@/components/CreateCategoryModal"
import EditCategoryModal from "@/components/EditCategoryModal"

export default function CategoryPage() {
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const pageSize = 5

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getCategoriesApi()

        // ✅ handle cả 2 kiểu BE trả về
        const data = Array.isArray(res) ? res : res?.data || []

        setCategories(data)
      } catch (err) {
        console.error("Load categories error:", err)
      }
    }

    fetchData()
  }, [])

  // 🔥 DELETE
  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this category?"
      )
    ) {
      await deleteCategoryApi(id)

      setCategories((prev) =>
        prev.filter((c) => c.categoryId !== id)
      )

      if (paginatedData.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    }
  }

  const totalPages = Math.ceil(categories.length / pageSize)

  const paginatedData = categories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const gridLayout = "grid grid-cols-[2fr_2fr_2fr_1fr] items-center"

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            QUẢN LÝ DANH MỤC
          </h1>
          <p className="text-gray-500 text-sm">
            Tổ chức và quản lý danh mục POI
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition"
        >
          + Thêm danh mục mới
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border shadow-md overflow-hidden">

        {/* HEADER ROW */}
        <div className={`${gridLayout} px-8 py-4 text-sm font-bold text-pink-400 border-b bg-gray-50`}>
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
              className={`${gridLayout} px-8 py-4 hover:bg-pink-50/20 transition`}
            >

              {/* NAME */}
              <div className="font-bold text-gray-700 truncate">{c.name}</div>

              {/* CREATED */}
              <div className="text-sm text-gray-500 truncate">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-"}</div>

              {/* UPDATED */}
              <div className="text-sm text-gray-500 truncate">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "-"}</div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3">

                <button
                  onClick={() => setEditingCategory(c)}
                  className="p-2 text-gray-400 hover:text-blue-500 transition"
                >
                  <Edit3 size={18} />
                </button>

                <button
                  onClick={() =>
                    handleDelete(c.categoryId)
                  }
                  className="p-2 text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              No categories found
            </div>
          )}
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between px-8 py-4 text-sm text-gray-500 items-center">
          <p>Hiển thị {paginatedData.length} / {categories.length} danh mục</p>

          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className={`p-2 rounded-full ${currentPage === 1 ? "text-gray-300" : "text-gray-500 hover:text-pink-500 transition"}`}
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-lg ${currentPage === i + 1 ? "bg-pink-500 text-white font-bold" : "text-gray-500 hover:bg-gray-100 transition"}`}
              >
                {i + 1}</button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className={`p-2 rounded-full ${currentPage === totalPages ? "text-gray-300" : "text-gray-500 hover:text-pink-500 transition"}`}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

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
    </div>
  )
}