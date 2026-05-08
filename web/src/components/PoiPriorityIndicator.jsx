import { Star, TrendingUp } from 'lucide-react'

/**
 * PoiPriorityIndicator - Shows POI priority level based on subscription tier
 * Used to display the priority badge on POI cards and maps
 */
export const PoiPriorityIndicator = ({ 
  priorityLevel = 1, 
  subscriptionTier,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  if (!priorityLevel) return null

  // Normalize priority level 1-5
  const level = Math.max(1, Math.min(5, priorityLevel))
  
  const getLevelColor = () => {
    switch(level) {
      case 1: return 'text-gray-400 bg-gray-50'
      case 2: return 'text-blue-600 bg-blue-50'
      case 3: return 'text-purple-600 bg-purple-50'
      case 4: return 'text-orange-600 bg-orange-50'
      case 5: return 'text-red-600 bg-red-50'
      default: return 'text-gray-400 bg-gray-50'
    }
  }

  const getLevelLabel = () => {
    const labels = {
      1: 'Thấp',
      2: 'Trung bình',
      3: 'Cao',
      4: 'Rất cao',
      5: 'Tối cao'
    }
    return labels[level] || 'Không xác định'
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const containerSizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  }

  const iconSize = sizeClasses[size] || sizeClasses.md
  const containerSize = containerSizeClasses[size] || containerSizeClasses.md

  return (
    <div className={`
      flex items-center gap-1.5 rounded-full font-medium
      ${getLevelColor()}
      ${containerSize}
      ${className}
    `}>
      {level >= 4 ? (
        <TrendingUp className={`${iconSize} flex-shrink-0`} />
      ) : (
        <Star className={`${iconSize} flex-shrink-0`} />
      )}
      {showLabel && (
        <span>{getLevelLabel()}</span>
      )}
      {level >= 4 && (
        <span className="ml-0.5">⭐</span>
      )}
    </div>
  )
}

/**
 * PriorityBadgeGroup - Shows multiple priority levels or comparison
 */
export const PriorityBadgeGroup = ({ 
  currentLevel, 
  maxLevel = 5,
  size = 'md',
  className = '' 
}) => {
  return (
    <div className={`flex gap-1 ${className}`}>
      {Array.from({ length: maxLevel }).map((_, i) => {
        const level = i + 1
        const isFilled = level <= currentLevel
        const containerSizeClasses = {
          sm: 'w-3 h-3',
          md: 'w-4 h-4',
          lg: 'w-5 h-5'
        }
        const size_ = containerSizeClasses[size] || containerSizeClasses.md
        
        return (
          <div
            key={i}
            className={`
              rounded-full ${size_}
              ${isFilled 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-sm'
                : 'bg-gray-300'
              }
            `}
          />
        )
      })}
    </div>
  )
}

export default PoiPriorityIndicator
