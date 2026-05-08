import { useEffect, useState } from 'react'
import { DollarSign, CheckCircle, AlertCircle, RotateCw } from 'lucide-react'
import * as subscriptionApi from '../api/subscriptionApi'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import toast from 'react-hot-toast'

/**
 * AdminTransactionDashboard - Admin view for monitoring all payment transactions
 * Shows transaction history, status tracking, and refund management
 */
export const AdminTransactionDashboard = () => {
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

  const stats = [
    {
      label: 'Tổng giao dịch',
      value: transactions.length,
      icon: DollarSign,
      color: 'blue'
    },
    {
      label: 'Thành công',
      value: transactions.filter(t => t.status === 'SUCCESS').length,
      icon: CheckCircle,
      color: 'green'
    },
    {
      label: 'Thất bại',
      value: transactions.filter(t => t.status === 'FAILED').length,
      icon: AlertCircle,
      color: 'red'
    },
    {
      label: 'Đang xử lý',
      value: transactions.filter(t => t.status === 'PENDING').length,
      icon: RotateCw,
      color: 'yellow'
    }
  ]

  const totalRevenue = transactions
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
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Giao dịch</h1>
          <p className="text-gray-600 mt-2">Theo dõi và quản lý tất cả các giao dịch thanh toán</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            const colorClasses = {
              blue: 'bg-blue-50 border-blue-200 text-blue-600',
              green: 'bg-green-50 border-green-200 text-green-600',
              red: 'bg-red-50 border-red-200 text-red-600',
              yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600'
            }
            return (
              <div key={idx} className={`rounded-lg p-6 border ${colorClasses[stat.color]}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <Icon className="w-8 h-8 opacity-50" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Revenue Card */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg p-8">
          <p className="text-green-100 text-sm uppercase tracking-wide font-semibold">Doanh thu</p>
          <p className="text-4xl font-bold mt-2">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0
            }).format(totalRevenue)}
          </p>
          <p className="text-green-100 text-sm mt-2">
            Từ {transactions.filter(t => t.status === 'COMPLETED').length} giao dịch thành công
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Bộ lọc</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { value: null, label: 'Tất cả' },
              { value: 'SUCCESS', label: 'Thành công' },
              { value: 'PENDING', label: 'Đang xử lý' },
              { value: 'FAILED', label: 'Thất bại' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => {
                  setFilterStatus(filter.value)
                  setPage(1)
                }}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${filterStatus === filter.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200 text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Chủ sở hữu</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Gói</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Số tiền</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ngày</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions && transactions.length > 0 ? (
                    transactions.map((tx, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">{tx.transactionId?.substring(0, 10)}...</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{getPayerDisplay(tx)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{tx.planId || '-'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                            minimumFractionDigits: 0
                          }).format(tx.amount || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {tx.createdAt
                            ? format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })
                            : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(tx.status)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewDetail(tx)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        Không tìm thấy giao dịch nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between bg-white rounded-lg p-6 border border-gray-200">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white"
          >
            <option value={10}>10 trên trang</option>
            <option value={20}>20 trên trang</option>
            <option value={50}>50 trên trang</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= (pagination.totalPages || 1)}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Sau
            </button>
          </div>
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
