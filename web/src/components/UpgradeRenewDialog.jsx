import { useState } from 'react'
import { AlertCircle, CheckCircle, X } from 'lucide-react'
import { formatDateVN } from '@/utils/formatDate'

/**
 * UpgradeRenewDialog - Modal for upgrading or renewing subscription
 */
export const UpgradeRenewDialog = ({ 
  isOpen, 
  onClose, 
  subscription,
  availablePlans = [],
  onUpgrade,
  onRenew,
  loading = false
}) => {
  const [action, setAction] = useState('renew') // 'renew' or 'upgrade'
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const isExpired = subscription && new Date(subscription.expirationDate) < new Date()
  const currentPlan = subscription && availablePlans.find(p => p.id === subscription.planId)

  const handleUpgrade = async () => {
    try {
      setError(null)
      if (!selectedPlanId) {
        setError('Vui lòng chọn gói nâng cấp')
        return
      }
      await onUpgrade?.(selectedPlanId)
      onClose()
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra')
    }
  }

  const handleRenew = async () => {
    try {
      setError(null)
      await onRenew?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {action === 'renew' ? 'Gia hạn gói' : 'Nâng cấp gói'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Current Status */}
          {subscription && (
            <div className={`
              p-4 rounded-lg border-2
              ${isExpired
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
              }
            `}>
              <div className="flex gap-3">
                {isExpired ? (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {isExpired ? 'Gói hết hạn' : 'Gói đang hoạt động'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentPlan?.name || 'Gói tiêu chuẩn'} 
                    {!isExpired && ` - Hết hạn: ${formatDateVN(subscription.expirationDate, false)}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setAction('renew')
                setSelectedPlanId(null)
                setError(null)
              }}
              className={`
                flex-1 py-2 px-4 rounded-lg font-medium transition-all
                ${action === 'renew'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Gia hạn
            </button>
            <button
              onClick={() => {
                setAction('upgrade')
                setSelectedPlanId(null)
                setError(null)
              }}
              className={`
                flex-1 py-2 px-4 rounded-lg font-medium transition-all
                ${action === 'upgrade'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Nâng cấp
            </button>
          </div>

          {/* Renew Content */}
          {action === 'renew' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Giá gia hạn</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {subscription && new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      minimumFractionDigits: 0
                    }).format(subscription.planPrice || 0)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Gia hạn {subscription?.billingCycleInDays || 30} ngày từ ngày hôm nay
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleRenew}
                disabled={loading}
                className={`
                  w-full py-2 px-4 rounded-lg font-medium transition-all
                  ${loading
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                  }
                `}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận gia hạn'}
              </button>
            </div>
          )}

          {/* Upgrade Content */}
          {action === 'upgrade' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Chọn gói nâng cấp</h3>
                <div className="space-y-2">
                  {availablePlans.map(plan => {
                    const isCurrentPlan = subscription && plan.id === subscription.planId
                    return (
                      <label
                        key={plan.id}
                        className={`
                          p-3 border-2 rounded-lg cursor-pointer transition-all
                          ${selectedPlanId === plan.id
                            ? 'border-blue-600 bg-blue-50'
                            : isCurrentPlan
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-300'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="plan"
                            value={plan.id}
                            checked={selectedPlanId === plan.id}
                            onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                            disabled={isCurrentPlan}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{plan.name}</p>
                            <p className="text-sm text-gray-600">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                                minimumFractionDigits: 0
                              }).format(plan.price)} / {plan.billingCycleInDays} ngày
                            </p>
                          </div>
                          {isCurrentPlan && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              Hiện tại
                            </span>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleUpgrade}
                disabled={loading || !selectedPlanId}
                className={`
                  w-full py-2 px-4 rounded-lg font-medium transition-all
                  ${loading || !selectedPlanId
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                  }
                `}
              >
                {loading ? 'Đang xử lý...' : 'Nâng cấp'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UpgradeRenewDialog
