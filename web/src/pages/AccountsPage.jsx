import { useEffect, useState, useContext } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Trash2,
  Users,
  Shield,
  Briefcase,
  Loader2,
} from "lucide-react"
import toast from "react-hot-toast"

import {
  getUsersApi,
  updateUserApi,
  deleteUserApi,
} from "@/api/accountApi"

import {
  getSubscriptionPlansApi,
} from "@/api/subscriptionApi"
import { formatDateVN } from "@/utils/formatDate"

import CreateAccountModal from "@/components/CreateAccountModal"
import ConfirmModal from "@/components/ConfirmModal"
import PageHeader from "@/components/PageHeader"
import StatsCard from "@/components/StatsCard"
import { SearchContext } from "@/context/SearchContext"

const roleStyle = (role) => {
  if (role === "Admin")
    return "bg-pink-100 text-pink-500"

  if (role === "Owner")
    return "bg-[#FFF0F5] text-[#EE4B8E]"

  return "bg-gray-100 text-gray-500"
}

const formatDate = (dateString) => {
  return formatDateVN(dateString, false)
}

const safe = (value) => value || "—"

const normalizePlan = (plan) => ({
  ...plan,
  planId: plan?.planId || plan?.PlanId || plan?.id || null,
  name: plan?.name || plan?.Name || "",
})

const normalizeUser = (user) => ({
  ...user,
  accountId: user?.accountId || user?.AccountId || null,
  subscriptionPlanId:
    user?.subscriptionPlanId || user?.SubscriptionPlanId || null,
  isLocked: user?.isLocked ?? user?.IsLocked ?? false,
})

function getCurrentUser() {
  try {
    const raw =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user")

    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function AccountsPage() {
  const { searchFilter } = useContext(SearchContext)

  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [plans, setPlans] = useState([])

  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false)
  const [roleChangeData, setRoleChangeData] = useState({
    id: null,
    newRole: null,
    oldRole: null,
  })

  const [showLockModal, setShowLockModal] = useState(false)
  const [lockData, setLockData] = useState({
    id: null,
    isLocked: null,
  })

  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState(null)

  const currentUser = getCurrentUser()
  const currentUserId = currentUser?.accountId

  const pageSize = 5

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // USERS
        const userRes = await getUsersApi()
        const userData = Array.isArray(userRes)
          ? userRes
          : userRes?.data || []

        // PLANS
        const plansRes = await getSubscriptionPlansApi()

        const planData = Array.isArray(plansRes)
          ? plansRes
          : plansRes?.data || []

        setPlans(planData.map(normalizePlan))

        // USERS normalize
        setUsers(userData.map(normalizeUser))
      } catch (err) {
        console.error("Load users error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // =========================
  // SEARCH
  // =========================
  useEffect(() => {
    if (
      searchFilter?.pageType === "account" &&
      searchFilter?.query
    ) {
      const searchTerm = searchFilter.query.toLowerCase()

      const filtered = users.filter(
        (acc) =>
          acc.username?.toLowerCase().includes(searchTerm) ||
          acc.email?.toLowerCase().includes(searchTerm) ||
          acc.fullName?.toLowerCase().includes(searchTerm)
      )

      setFilteredUsers(filtered)
      setCurrentPage(1)
    } else {
      setFilteredUsers(users)
    }
  }, [searchFilter, users])

  // =========================
  // CREATE USER
  // =========================
  const handleAddUser = (user) => {
    setUsers((prev) => [user, ...prev])
  }

  // =========================
  // ROLE CHANGE
  // =========================
  const handleChangeRole = (id, newRole) => {
    const user = users.find((u) => u.accountId === id)

    setRoleChangeData({
      id,
      newRole,
      oldRole: user?.role,
    })

    setShowRoleChangeModal(true)
  }

  const handleConfirmRoleChange = async () => {
    try {
      setLoading(true)
      const res = await updateUserApi(roleChangeData.id, {
        role: roleChangeData.newRole,
      })

      const updated = res?.data ?? res

      setUsers((prev) =>
        prev.map((u) =>
          u.accountId === roleChangeData.id
            ? { ...u, role: updated.role, updatedAt: updated.updatedAt }
            : u
        )
      )

      toast.success(
        `Thay đổi role thành ${roleChangeData.newRole} thành công`
      )

      setShowRoleChangeModal(false)
    } catch (err) {
      toast.error(err?.response?.data || "Không thể cập nhật role")
      setShowRoleChangeModal(false)
    } finally {
      setLoading(false)
    }
  }

  // =========================
  // DELETE
  // =========================
  const handleDeleteClick = (id) => {
    setDeleteUserId(id)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteUserId) return
    try {
      setLoading(true)
      await deleteUserApi(deleteUserId)
      setUsers((prev) => prev.filter((u) => u.accountId !== deleteUserId))
      toast.success("Xóa tài khoản thành công")
    } catch (err) {
      toast.error(err?.response?.data || "Xóa thất bại")
    } finally {
      setLoading(false)
      setShowDeleteModal(false)
      setDeleteUserId(null)
    }
  }

  // =========================
  // LOCK
  // =========================
  const handleToggleLock = (id, isLocked) => {
    setLockData({ id, isLocked })
    setShowLockModal(true)
  }

  const handleConfirmToggleLock = async () => {
    try {
      setLoading(true)
      const res = await updateUserApi(lockData.id, {
        isLocked: !lockData.isLocked,
      })

      const updated = res?.data ?? res

      setUsers((prev) =>
        prev.map((u) =>
          u.accountId === lockData.id
            ? {
                ...u,
                isLocked: updated.isLocked,
                updatedAt: updated.updatedAt,
              }
            : u
        )
      )

      toast.success(
        lockData.isLocked
          ? "Mở khóa tài khoản thành công"
          : "Khóa tài khoản thành công"
      )

      setShowLockModal(false)
    } catch (err) {
      toast.error(
        err?.response?.data ||
          "Không thể cập nhật trạng thái khóa tài khoản"
      )

      setShowLockModal(false)
    } finally {
      setLoading(false)
    }
  }

  // =========================
  // PAGINATION
  // =========================
  const displayData = filteredUsers

  const totalPages = Math.ceil(displayData.length / pageSize)

  // Count metrics
  const totalCount = users.length
  const adminCount = users.filter((u) => u.role === "Admin").length
  const ownerCount = users.filter((u) => u.role === "Owner").length
  const lockedCount = users.filter((u) => u.isLocked).length

  const paginatedUsers = displayData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const gridLayout =
    "grid grid-cols-[1.5fr_1.5fr_2fr_1fr_1.2fr_1.5fr_1.2fr_1fr_0.8fr]"

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="QUẢN LÝ TÀI KHOẢN"
        description="Quản lý danh sách người dùng"
        icon={<Users size={24} />}
        actionButton={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-pink-100 hover:shadow-lg transition-all text-sm animate-fadeIn"
          >
            + Tạo tài khoản
          </button>
        }
      />

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="TỔNG TÀI KHOẢN"
          value={totalCount}
          sub={`${totalCount - lockedCount} đang hoạt động`}
          icon={<Users size={20} />}
        />
        <StatsCard
          title="QUẢN TRỊ VIÊN"
          value={adminCount}
          sub="Admin hệ thống"
          color="text-pink-600"
          icon={<Shield size={20} />}
        />
        <StatsCard
          title="CHỦ SỞ HỮU (OWNER)"
          value={ownerCount}
          sub="Quản lý địa điểm POI"
          color="text-emerald-600"
          icon={<Briefcase size={20} />}
        />
        <StatsCard
          title="TÀI KHOẢN BỊ KHÓA"
          value={lockedCount}
          sub="Tài khoản tạm ngưng"
          color="text-red-600"
          icon={<Lock size={20} />}
        />
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-pink-500 bg-white rounded-2xl border border-pink-100/30 shadow-sm animate-fadeIn">
          <Loader2 className="animate-spin mb-3" size={32} />
          <p className="text-sm font-semibold text-gray-700">Đang tải dữ liệu tài khoản...</p>
        </div>
      ) : paginatedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-pink-100/30 shadow-sm animate-fadeIn">
          <Users size={48} className="text-pink-200 mb-3" />
          <h3 className="text-base font-bold text-gray-700">Không tìm thấy tài khoản nào</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            Thử thay đổi từ khóa tìm kiếm hoặc tạo tài khoản mới để bắt đầu quản trị hệ thống.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-pink-100/30 overflow-hidden shadow-sm animate-fadeIn">
          {/* HEADER */}
          <div className={`${gridLayout} px-6 py-4 border-b text-[11px] font-bold text-center text-pink-500 bg-pink-50/20 tracking-wider uppercase`}>
            <span className="text-left">Họ và tên</span>
            <span>Username</span>
            <span>Email</span>
            <span>SĐT</span>
            <span>Role</span>
            <span>Gói đăng ký</span>
            <span>Ngày tạo</span>
            <span>Cập nhật</span>
            <span>Action</span>
          </div>

          {/* BODY */}
          {paginatedUsers.map((user) => {
            const isSelf = user.accountId === currentUserId
            const isDisabled = user.isLocked || isSelf

            // ===== FIX PLAN NAME =====
            const isAdmin = user.role === "Admin"

            const planId = user.subscriptionPlanId

            const subscriptionPlanName = isAdmin
              ? "—"
              : (planId &&
                  plans.find(
                    (p) =>
                      String(p.planId) === String(planId)
                  )?.name) || "—"

            return (
              <div
                key={user.accountId}
                className={`${gridLayout} px-6 py-4 border-b items-center hover:bg-pink-50/10 transition-colors`}
              >
                <div className="text-left font-semibold text-sm">
                  {safe(user.fullName)}
                </div>

                <div className="text-center text-sm text-gray-500">
                  {safe(user.username)}
                </div>

                <div className="text-center text-sm text-gray-500">
                  {safe(user.email)}
                </div>

                <div className="text-center text-sm text-gray-500">
                  {safe(user.phoneNumber)}
                </div>

                <div className="text-center">
                  <select
                    value={user.role}
                    disabled={isDisabled}
                    onChange={(e) =>
                      handleChangeRole(user.accountId, e.target.value)
                    }
                    className={`px-2 py-1 text-xs rounded-full cursor-pointer ${roleStyle(user.role)}`}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Owner">Owner</option>
                  </select>
                </div>

                <div className="text-center text-pink-500 font-semibold text-sm">
                  {subscriptionPlanName}
                </div>

                <div className="text-center text-xs text-gray-500">
                  {formatDate(user.createdAt)}
                </div>

                <div className="text-center text-xs text-gray-500">
                  {formatDate(user.updatedAt)}
                </div>

                <div className="flex justify-center items-center gap-2">
                  {isSelf ? (
                    <span className="text-gray-300">—</span>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          handleToggleLock(user.accountId, user.isLocked)
                        }
                        title={user.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                        className="p-2 rounded-xl text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors"
                      >
                        {user.isLocked ? (
                          <Lock size={16} />
                        ) : (
                          <Unlock size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user.accountId)}
                        title="Xóa tài khoản"
                        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {/* PAGINATION */}
          {totalPages > 0 && (
            <div className="flex justify-between px-8 py-4 text-sm text-gray-500 items-center bg-gray-50/50">
              <p>Hiển thị {paginatedUsers.length} / {displayData.length} tài khoản</p>

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
      )}

      {/* MODALS */}
      {showModal && (
        <CreateAccountModal
          onClose={() => setShowModal(false)}
          onCreated={handleAddUser}
        />
      )}

      {showLockModal && (
        <ConfirmModal
          open={showLockModal}
          title={lockData.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
          message={lockData.isLocked ? "Bạn có chắc chắn muốn mở khóa tài khoản này không?" : "Bạn có chắc chắn muốn khóa tài khoản này không? Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa."}
          confirmText={lockData.isLocked ? "Mở khóa" : "Khóa"}
          cancelText="Hủy"
          onConfirm={handleConfirmToggleLock}
          onCancel={() => setShowLockModal(false)}
          isLoading={loading}
        />
      )}

      {showRoleChangeModal && (
        <ConfirmModal
          open={showRoleChangeModal}
          title="Thay đổi quyền truy cập"
          message={`Bạn có chắc chắn muốn đổi quyền của tài khoản này từ ${roleChangeData.oldRole} sang ${roleChangeData.newRole} không?`}
          confirmText="Thay đổi"
          cancelText="Hủy"
          onConfirm={handleConfirmRoleChange}
          onCancel={() => setShowRoleChangeModal(false)}
          isLoading={loading}
        />
      )}

      {showDeleteModal && (
        <ConfirmModal
          open={showDeleteModal}
          title="Xác nhận xóa tài khoản?"
          message="Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này sẽ xóa vĩnh viễn tài khoản khỏi hệ thống và không thể hoàn tác."
          confirmText="Xóa"
          cancelText="Hủy"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
          isLoading={loading}
        />
      )}
    </div>
  )
}
