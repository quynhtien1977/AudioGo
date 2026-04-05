import { useEffect, useState } from "react"
import { Lock, Unlock, ChevronLeft, ChevronRight } from "lucide-react"
import {
  getUsersApi,
  toggleLockApi,
  updateRoleApi,
} from "../api/accountApi"
import CreateAccountModal from "../components/CreateAccountModal"

const roleStyle = (role) => {
  if (role === "ADMIN") return "bg-pink-100 text-pink-500"
  return "bg-blue-100 text-blue-500"
}

// Helper function để format ngày cho gọn
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function AccountsPage() {
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5 // Tăng nhẹ size vì bảng dài hơn

  useEffect(() => {
    getUsersApi().then(setUsers)
  }, [])

  const handleAddUser = (user) => {
    setUsers((prev) => [user, ...prev])
  }

  const handleToggleLock = async (id) => {
    await toggleLockApi(id)
    const now = new Date().toISOString();
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, locked: !u.locked, updatedAt: now } : u
      )
    )
  }

  const handleChangeRole = async (id, role) => {
    await updateRoleApi(id, role)
    const now = new Date().toISOString();
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, role, updatedAt: now } : u
      )
    )
  }

  const totalPages = Math.ceil(users.length / pageSize)
  const paginatedUsers = users.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Cấu hình Grid mới: 7 cột
  const gridLayout = "grid grid-cols-[1.5fr_2fr_1.5fr_1fr_1.2fr_1.2fr_0.5fr]";

  return (
    <div>
      {/* HEADER GIỮ NGUYÊN */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">QUẢN LÝ TÀI KHOẢN</h1>
          <p className="text-gray-500 text-sm">Quản lý danh sách người dùng và quyền hệ thống</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg shadow hover:bg-pink-600 transition-colors"
        >
          + Tạo tài khoản mới
        </button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {/* TABLE HEADER */}
        <div className={`${gridLayout} text-[13px] text-pink-400 px-6 py-3 border-b font-bold tracking-wider uppercase`}>
          <span>Họ và tên</span>
          <span>Email</span>
          <span>Mật khẩu</span>
          <span>Role</span>
          <span>Ngày tạo</span>
          <span>Cập nhật</span>
          <span className="text-right">Khóa</span>
        </div>

        {/* TABLE BODY */}
        {paginatedUsers.map((user) => (
          <div
            key={user.id}
            className={`${gridLayout} items-center px-6 py-4 border-b hover:bg-gray-50 transition-colors ${
              user.locked ? "opacity-50" : ""
            }`}
          >
            <div>
              <p className="font-semibold text-sm text-gray-800">{user.name}</p>
              <p className="text-[10px] text-gray-400 font-mono">ID: {user.id}</p>
            </div>

            <div className="text-gray-500 text-sm truncate pr-2">{user.email}</div>

            <div className="text-sm text-gray-400 font-mono italic">
              {user.locked ? "****" : user.password}
            </div>

            <div>
              <select
                value={user.role}
                onChange={(e) => handleChangeRole(user.id, e.target.value)}
                className={`px-2 py-1 text-[10px] rounded-full font-bold outline-none border-none cursor-pointer ${roleStyle(user.role)}`}
                disabled={user.locked}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="MANAGER">MANAGER</option>
              </select>
            </div>

            {/* CỘT CREATED AT */}
            <div className="text-xs text-gray-500">
              {formatDate(user.createdAt)}
            </div>

            {/* CỘT UPDATED AT */}
            <div className="text-xs text-gray-500">
              {formatDate(user.updatedAt)}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleToggleLock(user.id)}
                className={`p-2 rounded-lg transition-colors ${user.locked ? "text-red-400 hover:bg-red-50" : "text-gray-400 hover:bg-gray-100"}`}
                title={user.locked ? "Unlock account" : "Lock account"}
              >
                {user.locked ? <Lock size={16} /> : <Unlock size={16} />}
              </button>
            </div>
          </div>
        ))}

        {/* PAGINATION GIỮ NGUYÊN */}
        <div className="flex justify-between items-center px-6 py-4 text-sm text-gray-500">
          <p>Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, users.length)} của {users.length}</p>
          <div className="flex items-center gap-1">
             <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 border rounded-md hover:bg-pink-50"><ChevronLeft size={14} /></button>
             {[...Array(totalPages)].map((_, i) => (
               <button 
                 key={i} 
                 onClick={() => setCurrentPage(i + 1)}
                 className={`px-3 py-1 rounded-md ${currentPage === i + 1 ? "bg-pink-500 text-white" : "border hover:bg-pink-50"}`}
               >
                 {i + 1}
               </button>
             ))}
             <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 border rounded-md hover:bg-pink-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {showModal && (
        <CreateAccountModal
          onClose={() => setShowModal(false)}
          onCreated={handleAddUser}
        />
      )}
    </div>
  )
}