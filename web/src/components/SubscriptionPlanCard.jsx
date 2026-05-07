import { Check, X } from 'lucide-react'

/**
 * SubscriptionPlanCard - Card displaying a subscription plan
 * Shows plan details, pricing, and features
 */
export const SubscriptionPlanCard = ({ 
  plan, 
  isCurrentPlan = false,
  onSelect,
  onViewDetails,
  className = ''
}) => {
  if (!plan) return null

  // Parse features from description
  const features = plan.description?.split(',').map(f => f.trim()) || []

  return (
    <div className={`
      border rounded-lg p-6 transition-all
      ${isCurrentPlan 
        ? 'border-green-500 bg-green-50 shadow-lg' 
        : 'border-gray-200 hover:shadow-lg hover:border-gray-300'
      }
      ${className}
    `}>
      {/* Plan Name & Badge */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{plan.description?.split(',')[0]}</p>
        </div>
        {isCurrentPlan && (
          <div className="px-3 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded-full">
            Gói hiện tại
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0
            }).format(plan.price)}
          </span>
          <span className="text-gray-600 text-sm">/{plan.billingCycleInDays} ngày</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Khoảng {(plan.billingCycleInDays / 30).toFixed(1)} tháng
        </p>
      </div>

      {/* Features */}
      <div className="mb-6 space-y-3 min-h-[150px]">
        {/* POI Limit */}
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Tối đa POI</p>
            <p className="text-sm text-gray-600">{plan.maxPoiCount || '∞'} điểm</p>
          </div>
        </div>

        {/* Media Storage */}
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Bộ nhớ lưu trữ</p>
            <p className="text-sm text-gray-600">{plan.storageInGb || '∞'} GB</p>
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Độ ưu tiên</p>
            <p className="text-sm text-gray-600">
              Mức {plan.priorityLevel || 1}/5
            </p>
          </div>
        </div>

        {/* Support */}
        {plan.supportLevel && (
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Hỗ trợ</p>
              <p className="text-sm text-gray-600">{plan.supportLevel}</p>
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => onSelect?.(plan)}
          disabled={isCurrentPlan}
          className={`
            w-full py-2 px-4 rounded-lg font-medium transition-all
            ${isCurrentPlan
              ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }
          `}
        >
          {isCurrentPlan ? 'Gói hiện tại' : 'Chọn gói'}
        </button>
        
        {onViewDetails && (
          <button
            onClick={() => onViewDetails?.(plan)}
            className="w-full py-2 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
          >
            Chi tiết
          </button>
        )}
      </div>
    </div>
  )
}

export default SubscriptionPlanCard
