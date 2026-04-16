import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Trash, Lock, Unlock } from "lucide-react"
import toast from "react-hot-toast"

import {
  getUsersApi,
  updateUserApi,
  deleteUserApi
} from "@/api/accountApi"

import CreateAccountModal from "@/components/CreateAccountModal"
import ConfirmModal from "@/components/ConfirmModal"

const roleStyle = (role) => {
  if (role === "Admin") return "bg-pink-100 text-pink-500"
  if (role === "Owner") return "bg-blue-100 text-blue-500"
  return "bg-gray-100 text-gray-500"
}

// format date
const formatDate = (dateString) => {
  if (!dateString) return "Unknown"
  return new Date(dateString).toLocaleDateString("vi-VN")
}

// fallback helper
const safe = (value) => value || "Unknown"

export default function AccountsPage() {
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false)
  const [roleChangeData, setRoleChangeData] = useState({ id: null, newRole: null, oldRole: null })

  const pageSize = 5

  // LOAD DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getUsersApi()
        const data = Array.isArray(res) ? res : res?.data || []
        setUsers(data)
      } catch (err) {
        console.error("Load users error:", err)
      }
    }

    fetchData()
  }, [])

  // CREATE
  const handleAddUser = (user) => {
    setUsers(prev => [user, ...prev])
  }

  // UPDATE ROLE ✅ FIXED
  const handleChangeRole = (id, newRole) => {
    const user = users.find(u => u.accountId === id)
    setRoleChangeData({ id, newRole, oldRole: user?.role })
    setShowRoleChangeModal(true)
  }

  const handleConfirmRoleChange = async () => {
    try {
      const res = await updateUserApi(roleChangeData.id, { role: roleChangeData.newRole })
      const updated = res?.data ?? res

      setUsers(prev =>
        prev.map(u =>
          u.accountId === roleChangeData.id
            ? {
                ...u,
                role: updated.role,
                updatedAt: updated.updatedAt
              }
            : u
        )
      )
      toast.success(`Thay đổi role thành ${roleChangeData.newRole} thành công`)
      setShowRoleChangeModal(false)
    } catch (err) {
      console.error(err)
      toast.error("Không thể cập nhật role")
    }
  }

  // DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa tài khoản này?")) return

    try {
      await deleteUserApi(id)

      setUsers(prev =>
        prev.filter(u => u.accountId !== id)
      )
      toast.success("Xóa tài khoản thành công")
    } catch (err) {
      console.error(err)
      toast.error("Xóa thất bại")
    }
  }

  const handleToggleLock = async (id, isLocked) => {
    try {
      const res = await updateUserApi(id, { isLocked: !isLocked })
      const updated = res?.data ?? res

      setUsers(prev =>
        prev.map(u =>
          u.accountId === id
            ? {
                ...u,
                isLocked: updated.isLocked,
                updatedAt: updated.updatedAt,
              }
            : u
        )
      )
      toast.success(isLocked ? "Mở khóa tài khoản thành công" : "Khóa tài khoản thành công")
    } catch (err) {
      console.error(err)
      toast.error("Không thể cập nhật trạng thái khóa tài khoản")
    }
  }

  useEffect(() => {
    setUsers((prev) =>
      prev.map((user) => ({
        ...user,
        isLocked: user.isLocked ?? false, // Default to false (not locked)
      }))
    );
  }, []);

  const totalPages = Math.ceil(users.length / pageSize)

  const paginatedUsers = users.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const gridLayout =
    "grid grid-cols-[1.5fr_1.5fr_2fr_1fr_1.2fr_1.2fr_1fr_0.5fr]"

  return (
    <div>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            QUẢN LÝ TÀI KHOẢN
          </h1>
          <p className="text-gray-500 text-sm">
            Quản lý danh sách người dùng
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg"
        >
          + Tạo tài khoản
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border overflow-hidden">

        {/* HEADER */}
        <div className={`${gridLayout} text-[13px] text-pink-400 px-6 py-3 border-b font-bold uppercase text-center`}>
          <span className="text-left">Họ và tên</span>
          <span>Username</span>
          <span>Email</span>
          <span>SĐT</span>
          <span>Role</span>
          <span>Ngày tạo</span>
          <span>Cập nhật</span>
          <span className="text-right">Action</span>
        </div>

        {/* BODY */}
        {paginatedUsers.map((user) => (
          <div
            key={user.accountId}
            className={`${gridLayout} items-center px-6 py-4 border-b hover:bg-gray-50`}
          >
            {/* FULL NAME */}
            <div className="text-left">
              <p className="font-semibold text-sm text-gray-800">
                {safe(user.fullName)}
              </p>
            </div>

            {/* USERNAME */}
            <div className="text-center text-gray-500 text-sm">
              {safe(user.username)}
            </div>

            {/* EMAIL */}
            <div className="text-center text-gray-500 text-sm">
              {safe(user.email)}
            </div>

            {/* PHONE */}
            <div className="text-center text-gray-500 text-sm">
              {safe(user.phoneNumber)}
            </div>

            {/* ROLE */}
            <div className="text-center">
              <select
                value={user.role}
                onChange={(e) =>
                  handleChangeRole(user.accountId, e.target.value)
                }
                disabled={user.isLocked}
                className={`px-2 py-1 text-[10px] rounded-full font-bold ${roleStyle(user.role)} ${user.isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <option value="Admin">Admin</option>
                <option value="Owner">Owner</option>
              </select>
            </div>

            {/* CREATED */}
            <div className="text-center text-xs text-gray-500">
              {formatDate(user.createdAt)}
            </div>

            {/* UPDATED */}
            <div className="text-center text-xs text-gray-500">
              {formatDate(user.updatedAt)}
            </div>

            {/* ACTION */}
            <div className="flex justify-end">
              <button
                onClick={() => handleToggleLock(user.accountId, user.isLocked)}
                className="text-gray-500 hover:text-pink-500 text-sm"
              >
                {user.isLocked ? (
                  <Lock size={16} />
                ) : (
                  <Unlock size={16} />
                )}
              </button>
            </div>
          </div>
        ))}

        {/* EMPTY */}
        {users.length === 0 && (
          <div className="p-10 text-center text-gray-400">
            Không có dữ liệu
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex justify-between px-8 py-4 text-sm text-gray-500 items-center">
          <p>
            {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, users.length)} / {users.length}
          </p>

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

      {/* MODAL */}
      {showModal && (
        <CreateAccountModal
          onClose={() => setShowModal(false)}
          onCreated={handleAddUser}
        />
      )}

      {/* ROLE CHANGE CONFIRMATION MODAL */}
      {showRoleChangeModal && (
        <ConfirmModal
          open={showRoleChangeModal}
          title="Xác nhận thay đổi role?"
          message={`Bạn có chắc chắn muốn thay đổi role từ "${roleChangeData.oldRole}" thành "${roleChangeData.newRole}" không?`}
          confirmText="Thay đổi"
          cancelText="Hủy bỏ"
          onConfirm={handleConfirmRoleChange}
          onCancel={() => setShowRoleChangeModal(false)}
        />
      )}
    </div>
  )
}