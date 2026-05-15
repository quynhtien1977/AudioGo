import { formatDateVN } from '@/utils/formatDate'

/**
 * SubscriptionBadge - Displays current subscription status
 * Shows plan name, expiration date, and status
 */
export const SubscriptionBadge = ({ subscription, className = '' }) => {
  if (!subscription) {
    return (
      <div className={`px-3 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm font-medium inline-block ${className}`}>
        Không có gói
      </div>
    )
  }

  const isExpired = new Date(subscription.expirationDate) < new Date()
  const daysLeft = Math.ceil((new Date(subscription.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))

  const getStatusColor = () => {
    if (subscription.status === 'CANCELLED') return 'bg-red-100 text-red-800'
    if (isExpired) return 'bg-gray-100 text-gray-800'
    if (daysLeft <= 7) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = () => {
    if (subscription.status === 'CANCELLED') return 'Đã hủy'
    if (isExpired) return 'Hết hạn'
    if (daysLeft <= 0) return 'Hết hạn'
    return `Còn ${daysLeft} ngày`
  }

  return (
    <div className={`px-3 py-2 rounded-lg ${getStatusColor()} text-sm font-medium inline-block ${className}`}>
      <div className="font-semibold">{subscription.planName || 'Gói tiêu chuẩn'}</div>
      <div className="text-xs mt-1">
        {subscription.status === 'CANCELLED' 
          ? 'Đã hủy' 
          : `${getStatusText()} • Hết hạn: ${formatDateVN(subscription.expirationDate, false)}`
        }
      </div>
    </div>
  )
}

export default SubscriptionBadge
