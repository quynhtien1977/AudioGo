/**
 * EmptyState — Component trống dùng chung cho các trang không có dữ liệu.
 *
 * Props:
 *   icon        — React element (e.g. <MapPin size={48} />) — sẽ được wrap trong vòng tròn màu
 *   title       — Tiêu đề ngắn (vd: "Chưa có POI nào")
 *   description — Mô tả hướng dẫn ngắn (optional)
 *   variant     — "default" (hồng) | "muted" (xám nhạt)
 */
const EmptyState = ({
  icon,
  title,
  description,
  variant = "default"
}) => {
  const isMuted = variant === "muted"

  const iconWrapperClass = isMuted
    ? "w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 mb-4"
    : "w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-pink-300 mb-4"

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-2xl border border-pink-100/30 shadow-sm animate-in fade-in duration-300">
      
      {/* Icon */}
      {icon && (
        <div className={iconWrapperClass}>
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-sm font-bold text-gray-700 mb-1">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs text-gray-400 leading-relaxed max-w-xs mb-1">
          {description}
        </p>
      )}
    </div>
  )
}

export default EmptyState
