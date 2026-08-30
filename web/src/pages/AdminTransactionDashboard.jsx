import { useEffect, useState, useContext } from 'react'
import { DollarSign, CheckCircle, AlertCircle, RotateCw, Loader2, CreditCard, Search, Calendar, ChevronDown, XCircle, Clock, Download, Filter, RefreshCw, TrendingUp, Copy, Check, User, ShieldCheck } from 'lucide-react'
import PageLoader from "@/components/PageLoader"
import * as subscriptionApi from '../api/subscriptionApi'
import { formatDateVN } from '../utils/formatDate'
import toast from 'react-hot-toast'
import PageHeader from "@/components/PageHeader"
import StatsCard from "@/components/StatsCard"
import EmptyState from "@/components/EmptyState"
import { SearchContext } from '../context/SearchContext'

/**
 * AdminTransactionDashboard - Admin view for monitoring all payment transactions
 * Shows transaction history, status tracking, and refund management
 */
export const AdminTransactionDashboard = () => {
  const { searchFilter } = useContext(SearchContext)
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalItems: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filterStatus, setFilterStatus] = useState(null)
  const [selectedTx, setSelectedTx] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // ── Server-side global stats (không bị ảnh hưởng bởi phân trang) ──────────
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    pending: 0,
    totalRevenue: 0,
  })

  // Fetch global counts 1 lần duy nhất khi mount (pageSize=1 để nhanh, chỉ cần metadata)
  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const [all, success, failed, pending] = await Promise.all([
          subscriptionApi.getAllTransactionsApi(1, 1, null),
          subscriptionApi.getAllTransactionsApi(1, 1, 'SUCCESS'),
          subscriptionApi.getAllTransactionsApi(1, 1, 'FAILED'),
          subscriptionApi.getAllTransactionsApi(1, 1, 'PENDING'),
        ])
        setGlobalStats({
          total:   all?.pagination?.totalItems     ?? all?.pagination?.total     ?? 0,
          success: success?.pagination?.totalItems ?? success?.pagination?.total ?? 0,
          failed:  failed?.pagination?.totalItems  ?? failed?.pagination?.total  ?? 0,
          pending: pending?.pagination?.totalItems ?? pending?.pagination?.total ?? 0,
          // Doanh thu tổng thực sự cần endpoint riêng; hiện tại giữ 0 để không mislead
          totalRevenue: 0,
        })
      } catch (e) {
        console.error('Failed to fetch global stats:', e)
      }
    }
    fetchGlobalStats()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const data = await subscriptionApi.getAllTransactionsApi(page, pageSize, filterStatus)
      setTransactions(data?.data || [])
      setPagination(data?.pagination || { page, pageSize, totalItems: 0, totalPages: 1 })
      setError(null)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError(err.message)
      toast.error('Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [page, pageSize, filterStatus])

  const [copiedId, setCopiedId] = useState(false)

  const handleViewDetail = async (tx) => {
    setSelectedTx(tx)
    setDetailData(null)
    setLoadingDetail(true)
    try {
      const res = await subscriptionApi.getTransactionDetailsApi(tx.transactionId)
      setDetailData(res)
    } catch (e) {
      console.error("Failed to load transaction detail:", e)
      setDetailData(tx)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleCopyTxId = (id) => {
    navigator.clipboard.writeText(id)
    setCopiedId(true)
    toast.success("Đã sao chép mã giao dịch!")
    setTimeout(() => setCopiedId(false), 2000)
  }

  /** Du khách: contactInfo. Owner (gói POI): username, fallback accountId. */
  const getPayerDisplay = (tx) => {
    if (tx.paymentType === 'OWNER_SUBSCRIPTION') {
      return tx.accountUsername || tx.accountId || '-'
    }
    return tx.contactInfo || '-'
  }

  /** Hiển thị tên gói cước */
  const getPlanDisplay = (tx) => {
    if (tx.plan?.name) return tx.plan.name
    if (tx.planName) return tx.planName
    if (tx.paymentType === 'TOURIST_ACCESS') return 'Truy cập App'
    return tx.planId || '-'
  }

  // ── Tìm kiếm client-side trong trang hiện tại ──────────────────────────────
  const searchQuery = (searchFilter?.pageType === "transaction" && searchFilter?.query)
    ? searchFilter.query.toLowerCase()
    : ""

  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true
    const payer   = getPayerDisplay(tx).toLowerCase()
    const txId    = (tx.transactionId || "").toLowerCase()
    const plan    = (tx.planName || tx.planId || "").toLowerCase()
    const uname   = (tx.accountUsername || "").toLowerCase()
    return payer.includes(searchQuery) || txId.includes(searchQuery)
        || plan.includes(searchQuery)  || uname.includes(searchQuery)
  })

  // Revenue của trang hiện tại (chỉ dùng cho hiển thị phụ, banner dùng globalStats)
  const pageRevenue = filteredTransactions
    .filter(t => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const getStatusBadge = (status) => {
    const configs = {
      'SUCCESS': {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
        label: 'Thành công'
      },
      'PENDING': {
        bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        icon: <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
        label: 'Đang xử lý'
      },
      'FAILED': {
        bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
        icon: <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />,
        label: 'Thất bại'
      },
      'EXPIRED': {
        bg: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />,
        label: 'Hết hạn'
      },
      'REFUNDED': {
        bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
        icon: <RotateCw className="w-3.5 h-3.5 text-purple-500 shrink-0" />,
        label: 'Đã hoàn tiền'
      },
    }
    const config = configs[status] || {
      bg: 'bg-gray-50 text-gray-600 border-gray-200',
      icon: <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />,
      label: status || 'Chưa xác định'
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${config.bg}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="QUẢN LÝ GIAO DỊCH"
        description="Theo dõi và quản lý tất cả các giao dịch thanh toán trong hệ thống."
        icon={<DollarSign size={24} />}
      />

      {/* Stats — dùng globalStats từ server, không bị giới hạn bởi phân trang */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="TỔNG GIAO DỊCH"
          value={globalStats.total}
          sub="Toàn bộ giao dịch"
          icon={<DollarSign size={20} />}
        />
        <StatsCard
          title="GIAO DỊCH THÀNH CÔNG"
          value={globalStats.success}
          sub="Tổng thành công"
          color="text-green-600"
          icon={<CheckCircle size={20} />}
        />
        <StatsCard
          title="GIAO DỊCH THẤT BẠI"
          value={globalStats.failed}
          sub="Tổng thất bại"
          color="text-red-600"
          icon={<AlertCircle size={20} />}
        />
        <StatsCard
          title="ĐANG XỬ LÝ"
          value={globalStats.pending}
          sub="Tổng đang chờ"
          color="text-yellow-600"
          icon={<RotateCw size={20} />}
        />
      </div>

      {/* Revenue Card — chú thích rõ "trang hiện tại" để không mislead */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl p-8 shadow-md hover:scale-[1.01] transition-all duration-300">
        <p className="text-pink-100 text-xs uppercase tracking-wider font-bold">Doanh thu trang hiện tại</p>
        <p className="text-4xl font-black mt-2">
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
          }).format(pageRevenue)}
        </p>
        <p className="text-pink-100 text-xs mt-2 font-medium">
          Từ {filteredTransactions.filter(t => t.status === 'SUCCESS').length} giao dịch thành công
          {searchQuery ? ` (đang lọc tìm kiếm)` : ` trên trang ${page}`}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-pink-100/30 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* TABS FOR STATUS */}
          <div className="flex bg-[#FFF0F5] p-1 rounded-2xl gap-1 self-start flex-wrap md:flex-nowrap">
            {[
              { value: null,      label: `Tất cả (${globalStats.total})` },
              { value: 'SUCCESS', label: `Thành công (${globalStats.success})` },
              { value: 'PENDING', label: `Đang xử lý (${globalStats.pending})` },
              { value: 'FAILED',  label: `Thất bại (${globalStats.failed})` }
            ].map(f => (
              <button
                key={f.value}
                onClick={() => {
                  setFilterStatus(f.value)
                  setPage(1)
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === f.value
                    ? "bg-white text-pink-600 shadow-sm"
                    : "text-[#8E707E] hover:text-pink-600"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Results Indicator */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-xs font-bold text-[#8E707E] bg-[#FFF0F5] px-4 py-2.5 rounded-2xl shadow-sm border border-pink-100/10">
              Kết quả: <span className="text-pink-600">{filteredTransactions.length}</span> / {transactions.length}
            </div>
          </div>

        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-pink-100/30 overflow-hidden shadow-sm">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-red-800 text-sm font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <PageLoader text="Đang tải danh sách giao dịch..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-pink-50/20 text-[11px] font-bold text-pink-500 tracking-wider uppercase border-b border-pink-100/20">
                <tr>
                  <th className="px-6 py-4 text-left">ID</th>
                  <th className="px-6 py-4 text-left">Chủ sở hữu</th>
                  <th className="px-6 py-4 text-left">Gói</th>
                  <th className="px-6 py-4 text-left">Số tiền</th>
                  <th className="px-6 py-4 text-left">Ngày</th>
                  <th className="px-6 py-4 text-left">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50/50">
                {filteredTransactions && filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-pink-50/10 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-gray-500">{tx.transactionId?.substring(0, 10)}...</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">{getPayerDisplay(tx)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">{getPlanDisplay(tx)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-800">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          minimumFractionDigits: 0
                        }).format(tx.amount || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 font-medium">
                        {tx.createdAt
                          ? formatDateVN(tx.createdAt, true)
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewDetail(tx)}
                          className="px-3 py-1.5 rounded-lg text-pink-600 bg-pink-50 hover:bg-pink-100 text-xs font-bold transition-all cursor-pointer"
                          title="Xem chi tiết giao dịch này"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400 animate-fadeIn">
                      <EmptyState
                        icon={<DollarSign size={40} />}
                        title="Không tìm thấy giao dịch nào"
                        description="Không tìm thấy dữ liệu giao dịch nào khớp với bộ lọc hiện tại của bạn."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-pink-100/30 shadow-sm flex-wrap gap-4">
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value))
            setPage(1)
          }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 outline-none bg-white cursor-pointer"
        >
          <option value={10}>10 dòng / trang</option>
          <option value={20}>20 dòng / trang</option>
          <option value={50}>50 dòng / trang</option>
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            title="Trang trước"
            className="px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-pink-50 hover:text-pink-600 text-xs disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            Trước
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= (pagination.totalPages || 1)}
            title="Trang tiếp theo"
            className="px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-pink-50 hover:text-pink-600 text-xs disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            Sau
          </button>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-pink-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-pink-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-100/80 flex items-center justify-center text-pink-600">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Chi tiết giao dịch</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-mono text-gray-500">{selectedTx.transactionId}</span>
                    <button
                      onClick={() => handleCopyTxId(selectedTx.transactionId)}
                      className="text-gray-400 hover:text-pink-600 transition p-0.5"
                      title="Sao chép mã"
                    >
                      {copiedId ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition cursor-pointer"
                title="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {loadingDetail ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <Loader2 size={28} className="animate-spin text-pink-500" />
                  <p className="text-xs font-medium">Đang tải chi tiết giao dịch...</p>
                </div>
              ) : (() => {
                const tx = detailData || selectedTx
                const isOwner = tx.paymentType === 'OWNER_SUBSCRIPTION'

                return (
                  <>
                    {/* Amount Banner */}
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-100/60 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-pink-500 uppercase tracking-wider">Số tiền thanh toán</p>
                        <p className="text-2xl font-black text-gray-900 mt-0.5">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                            minimumFractionDigits: 0
                          }).format(tx.amount || 0)}
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>

                    {/* Section 1: Payer Info */}
                    <div className="bg-gray-50/70 rounded-2xl p-4 space-y-2.5 border border-gray-100">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <User size={13} />
                        Thông tin người thanh toán
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400 block">Loại giao dịch:</span>
                          <span className="font-semibold text-gray-800">{isOwner ? 'Chủ sở hữu (Nâng cấp gói POI)' : 'Du khách (Mua quyền App)'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Chủ tài khoản / Liên hệ:</span>
                          <span className="font-semibold text-gray-900">{getPayerDisplay(tx)}</span>
                        </div>
                        {tx.accountId && (
                          <div className="col-span-2">
                            <span className="text-gray-400 block">Mã tài khoản (AccountId):</span>
                            <span className="font-mono text-gray-600 text-[11px]">{tx.accountId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 2: Plan & Subscription Info */}
                    <div className="bg-gray-50/70 rounded-2xl p-4 space-y-2.5 border border-gray-100">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={13} />
                        Gói dịch vụ
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400 block">Gói:</span>
                          <span className="font-bold text-pink-600">{getPlanDisplay(tx)}</span>
                        </div>
                        {tx.plan?.price && (
                          <div>
                            <span className="text-gray-400 block">Giá niêm yết:</span>
                            <span className="font-semibold text-gray-700">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tx.plan.price)}
                            </span>
                          </div>
                        )}
                        {tx.subscription && (
                          <>
                            <div>
                              <span className="text-gray-400 block">Gói kích hoạt:</span>
                              <span className="font-semibold text-emerald-600">{tx.subscription.status}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block">Thời hạn:</span>
                              <span className="text-gray-600">
                                {tx.subscription.startDate ? formatDateVN(tx.subscription.startDate) : '—'} → {tx.subscription.endDate ? formatDateVN(tx.subscription.endDate) : '—'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Section 3: Gateway Info */}
                    <div className="bg-gray-50/70 rounded-2xl p-4 space-y-2.5 border border-gray-100">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard size={13} />
                        Cổng thanh toán & Đối soát
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400 block">Cổng thanh toán:</span>
                          <span className="font-semibold text-gray-800">{tx.gateway || 'Chưa chọn'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Trạng thái cổng:</span>
                          <span className="font-semibold text-gray-700">{tx.gatewayStatus || '—'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-400 block">Mã đối soát bên thứ 3 (GatewayTransId):</span>
                          <span className="font-mono text-gray-800 text-[11px]">
                            {tx.gatewayTransId || (
                              <span className="text-gray-400 italic">Chưa có (Giao dịch test / thanh toán nội bộ / chưa nhận webhook)</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Timestamps */}
                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 pt-1">
                      <div>
                        <span className="text-gray-400 block text-[11px]">Thời điểm tạo:</span>
                        <span>{tx.createdAt ? formatDateVN(tx.createdAt, true) : '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Thời điểm hoàn tất:</span>
                        <span>{tx.completedAt ? formatDateVN(tx.completedAt, true) : '—'}</span>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs transition"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTransactionDashboard
