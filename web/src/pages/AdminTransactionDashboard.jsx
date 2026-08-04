import { useEffect, useState, useContext } from 'react'
import { DollarSign, CheckCircle, AlertCircle, RotateCw, Loader2 } from 'lucide-react'
import PageLoader from "@/components/PageLoader"
import * as subscriptionApi from '../api/subscriptionApi'
import { formatDateVN } from '../utils/formatDate'
import toast from 'react-hot-toast'
import PageHeader from "@/components/PageHeader"
import StatsCard from "@/components/StatsCard"
import { SearchContext } from '../context/SearchContext'

/**
 * AdminTransactionDashboard - Admin view for monitoring all payment transactions
 * Shows transaction history, status tracking, and refund management
 */
export const AdminTransactionDashboard = () => {
  const { searchFilter } = useContext(SearchContext)
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filterStatus, setFilterStatus] = useState(null)
  const [selectedTx, setSelectedTx] = useState(null)

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const data = await subscriptionApi.getAllTransactionsApi(page, pageSize, filterStatus)
      setTransactions(data.data || [])
      setPagination(data.pagination || { page, pageSize, total: 0, totalPages: 1 })
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

  const handleViewDetail = (tx) => setSelectedTx(tx)

  /** Du khách: contactInfo. Owner (gói POI): username, fallback accountId. */
  const getPayerDisplay = (tx) => {
    if (tx.paymentType === 'OWNER_SUBSCRIPTION') {
      return tx.accountUsername || tx.accountId || '-'
    }
    return tx.contactInfo || '-'
  }

  const searchQuery = (searchFilter?.pageType === "transaction" && searchFilter?.query) ? searchFilter.query.toLowerCase() : ""

  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true
    const payer = getPayerDisplay(tx).toLowerCase()
    const txId = (tx.transactionId || "").toLowerCase()
    const plan = (tx.planId || "").toLowerCase()
    return payer.includes(searchQuery) || txId.includes(searchQuery) || plan.includes(searchQuery)
  })

  const stats = [
    {
      label: 'Tổng giao dịch',
      value: filteredTransactions.length,
      icon: DollarSign,
      color: 'blue'
    },
    {
      label: 'Thành công',
      value: filteredTransactions.filter(t => t.status === 'SUCCESS').length,
      icon: CheckCircle,
      color: 'green'
    },
    {
      label: 'Thất bại',
      value: filteredTransactions.filter(t => t.status === 'FAILED').length,
      icon: AlertCircle,
      color: 'red'
    },
    {
      label: 'Đang xử lý',
      value: filteredTransactions.filter(t => t.status === 'PENDING').length,
      icon: RotateCw,
      color: 'yellow'
    }
  ]

  const totalRevenue = filteredTransactions
    .filter(t => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const getStatusBadge = (status) => {
    const configs = {
      'SUCCESS': { bg: 'bg-green-50', text: 'text-green-800', label: 'Thành công' },
      'PENDING': { bg: 'bg-yellow-50', text: 'text-yellow-800', label: 'Đang xử lý' },
      'FAILED': { bg: 'bg-red-50', text: 'text-red-800', label: 'Thất bại' }
    }
    const config = configs[status] || configs.PENDING
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="TỔNG GIAO DỊCH"
          value={filteredTransactions.length}
          sub="Tất cả các giao dịch"
          icon={<DollarSign size={20} />}
        />
        <StatsCard
          title="GIAO DỊCH THÀNH CÔNG"
          value={filteredTransactions.filter(t => t.status === 'SUCCESS').length}
          sub="Giao dịch thành công"
          color="text-green-600"
          icon={<CheckCircle size={20} />}
        />
        <StatsCard
          title="GIAO DỊCH THẤT BẠI"
          value={filteredTransactions.filter(t => t.status === 'FAILED').length}
          sub="Giao dịch thất bại"
          color="text-red-600"
          icon={<AlertCircle size={20} />}
        />
        <StatsCard
          title="ĐANG XỬ LÝ"
          value={filteredTransactions.filter(t => t.status === 'PENDING').length}
          sub="Giao dịch đang xử lý"
          color="text-yellow-600"
          icon={<RotateCw size={20} />}
        />
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl p-8 shadow-md hover:scale-[1.01] transition-all duration-300">
        <p className="text-pink-100 text-xs uppercase tracking-wider font-bold">Doanh thu hệ thống</p>
        <p className="text-4xl font-black mt-2">
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
          }).format(totalRevenue)}
        </p>
        <p className="text-pink-100 text-xs mt-2 font-medium">
          Từ {filteredTransactions.filter(t => t.status === 'SUCCESS').length} giao dịch thành công
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-pink-100/30 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* TABS FOR STATUS */}
          <div className="flex bg-[#FFF0F5] p-1 rounded-2xl gap-1 self-start flex-wrap md:flex-nowrap">
            {[
              { value: null, label: `Tất cả (${transactions.length})` },
              { value: 'SUCCESS', label: `Thành công (${transactions.filter(t => t.status === 'SUCCESS').length})` },
              { value: 'PENDING', label: `Đang xử lý (${transactions.filter(t => t.status === 'PENDING').length})` },
              { value: 'FAILED', label: `Thất bại (${transactions.filter(t => t.status === 'FAILED').length})` }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => {
                  setFilterStatus(filter.value)
                  setPage(1)
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === filter.value
                    ? "bg-white text-pink-600 shadow-sm"
                    : "text-[#8E707E] hover:text-pink-600"
                }`}
              >
                {filter.label}
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
                      <td className="px-6 py-4 text-sm text-gray-600">{tx.planId || '-'}</td>
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
                          className="px-3 py-1.5 rounded-lg text-pink-600 bg-pink-50 hover:bg-pink-100 text-xs font-bold transition-all"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center text-gray-400 animate-fadeIn">
                      <div className="flex flex-col items-center justify-center">
                        <DollarSign size={48} className="text-pink-200 mb-3 animate-pulse" />
                        <h3 className="text-base font-bold text-gray-700">Không tìm thấy giao dịch nào</h3>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                          Không tìm thấy dữ liệu giao dịch nào khớp với bộ lọc hiện tại của bạn.
                        </p>
                      </div>
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
            className="px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-pink-50 hover:text-pink-600 text-xs disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Trước
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= (pagination.totalPages || 1)}
            className="px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-pink-50 hover:text-pink-600 text-xs disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Sau
          </button>
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết giao dịch</h2>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Đóng
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <p><span className="text-gray-500">Transaction:</span> <span className="font-mono">{selectedTx.transactionId}</span></p>
              <p><span className="text-gray-500">PaymentType:</span> {selectedTx.paymentType}</p>
              {selectedTx.paymentType === 'OWNER_SUBSCRIPTION' ? (
                <>
                  <p>
                    <span className="text-gray-500">Chủ sở hữu (username):</span>{' '}
                    <span className="font-medium text-gray-900">{selectedTx.accountUsername || selectedTx.accountId || '-'}</span>
                  </p>
                  {selectedTx.accountUsername && selectedTx.accountId && (
                    <p>
                      <span className="text-gray-500">Mã tài khoản:</span>{' '}
                      <span className="font-mono text-xs text-gray-700">{selectedTx.accountId}</span>
                    </p>
                  )}
                </>
              ) : (
                <p><span className="text-gray-500">Liên hệ (du khách):</span> {selectedTx.contactInfo || '-'}</p>
              )}
              <p><span className="text-gray-500">Plan:</span> {selectedTx.planId || '-'}</p>
              <p><span className="text-gray-500">Gateway:</span> {selectedTx.gateway || '-'}</p>
              <p><span className="text-gray-500">GatewayTransId:</span> {selectedTx.gatewayTransId || '-'}</p>
              <p><span className="text-gray-500">Status:</span> {selectedTx.status}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTransactionDashboard
