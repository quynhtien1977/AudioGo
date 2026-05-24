import { useEffect, useState, useContext } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Trash2,
  Users,
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

import CreateAccountModal from "@/components/CreateAccountModal"
import ConfirmModal from "@/components/ConfirmModal"
import PageHeader from "@/components/PageHeader"
import { SearchContext } from "@/context/SearchContext"

const roleStyle = (role) => {
  if (role === "Admin")
    return "bg-pink-100 text-pink-500"

  if (role === "Owner")
    return "bg-[#FFF0F5] text-[#EE4B8E]"

  return "bg-gray-100 text-gray-500"
}

const formatDate = (dateString) => {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleDateString("vi-VN")
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

  const currentUser = getCurrentUser()
  const currentUserId = currentUser?.accountId

  const pageSize = 5

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
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
    }
  }

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa tài khoản này?")) return

    try {
      await deleteUserApi(id)

      setUsers((prev) =>
        prev.filter((u) => u.accountId !== id)
      )

      toast.success("Xóa tài khoản thành công")
    } catch (err) {
      toast.error(err?.response?.data || "Xóa thất bại")
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
    }
  }

  // =========================
  // PAGINATION
  // =========================
  const displayData =
    filteredUsers.length > 0 ? filteredUsers : users

  const totalPages = Math.ceil(displayData.length / pageSize)

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

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-pink-100/30 overflow-hidden shadow-sm">
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
                      onClick={() => handleDelete(user.accountId)}
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
      </div>
    </div>
  )
}
