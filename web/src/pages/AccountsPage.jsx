import { useEffect, useState, useContext } from "react"
import { ChevronLeft, ChevronRight, Trash, Lock, Unlock } from "lucide-react"
import toast from "react-hot-toast"

import {
  getUsersApi,
  updateUserApi,
  deleteUserApi
} from "@/api/accountApi"

import CreateAccountModal from "@/components/CreateAccountModal"
import ConfirmModal from "@/components/ConfirmModal"
import { SearchContext } from "@/context/SearchContext"

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
  const { searchFilter } = useContext(SearchContext)
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false)
  const [roleChangeData, setRoleChangeData] = useState({ id: null, newRole: null, oldRole: null })
  const [showLockModal, setShowLockModal] = useState(false)
  const [lockData, setLockData] = useState({ id: null, isLocked: null })

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

  // SEARCH FILTERING EFFECT
  useEffect(() => {
    if (searchFilter?.pageType === "account" && searchFilter?.query) {
      const searchTerm = searchFilter.query.toLowerCase()
      const filtered = users.filter(
        (acc) =>
          acc.username?.toLowerCase().includes(searchTerm) ||
          acc.email?.toLowerCase().includes(searchTerm) || 
          acc.fullName?.toLowerCase().includes(searchTerm)
      )
      setFilteredUsers(filtered)
      setCurrentPage(1) // Reset to first page
    } else {
      setFilteredUsers(users)
    }
  }, [searchFilter, users])

  // CREATE
  const handleAddUser = (user) => {
    setUsers(prev => [user, ...prev])
  }

  // UPDATE ROLE 
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
    setLockData({ id, isLocked })
    setShowLockModal(true)
  }

  const handleConfirmToggleLock = async () => {
    try {
      const res = await updateUserApi(lockData.id, { isLocked: !lockData.isLocked })
      const updated = res?.data ?? res

      setUsers(prev =>
        prev.map(u =>
          u.accountId === lockData.id
            ? {
                ...u,
                isLocked: updated.isLocked,
                updatedAt: updated.updatedAt,
              }
            : u
        )
      )
      toast.success(lockData.isLocked ? "Mở khóa tài khoản thành công" : "Khóa tài khoản thành công")
      setShowLockModal(false)
    } catch (err) {
      console.error(err)
      toast.error("Không thể cập nhật trạng thái khóa tài khoản")
      setShowLockModal(false)
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

  const displayData = filteredUsers.length > 0 ? filteredUsers : users
  const totalPages = Math.ceil(displayData.length / pageSize)

  const paginatedUsers = displayData.slice(
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
        {totalPages > 0 && (
          <div className="flex justify-between items-center px-6 py-4 text-sm text-gray-500 bg-gray-50/50 border-t">
            <p>
              Hiển thị trang <span className="font-bold text-gray-800">{currentPage}</span> / <span className="font-bold">{totalPages}</span>
            </p>

            <div className="flex gap-1 items-center">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className={`p-2 rounded-full ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-pink-500 hover:bg-pink-50 transition"}`}
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
                      className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === p ? "bg-pink-500 text-white shadow-sm" : "hover:bg-pink-50 hover:text-pink-600"}`}
                    >
                      {p}
                    </button>
                  )
                ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className={`p-2 rounded-full ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-pink-500 hover:bg-pink-50 transition"}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
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

      {/* LOCK CONFIRMATION MODAL */}
      {showLockModal && (
        <ConfirmModal
          open={showLockModal}
          title={lockData.isLocked ? "Xác nhận mở khóa?" : "Xác nhận khóa?"}
          message={lockData.isLocked ? "Bạn có chắc chắn muốn mở khóa tài khoản này không?" : "Bạn có chắc chắn muốn khóa tài khoản này không?"}
          confirmText={lockData.isLocked ? "Mở khóa" : "Khóa"}
          cancelText="Hủy bỏ"
          onConfirm={handleConfirmToggleLock}
          onCancel={() => setShowLockModal(false)}
        />
      )}
    </div>
  )
}