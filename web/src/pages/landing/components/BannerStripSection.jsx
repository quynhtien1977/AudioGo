import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Sparkles, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

/**
 * BannerStripSection — Hiển thị banner sự kiện / khuyến mãi nổi bật trên Landing Page.
 * Hỗ trợ hoàn hảo cả Dark Mode & Light Mode (tương thích theo ThemeContext).
 * Hỗ trợ cảm ứng vuốt (Swipe) mượt mà trên điện thoại di động.
 * Tùy biến tiêu đề badge, nhãn nút CTA qua Landing Page Settings.
 */
export default function BannerStripSection({ banners = [], config = {} }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Cấu hình linh hoạt từ Landing Page Settings (có giá trị mặc định đẹp mắt)
  const badgeText = config?.badgeText?.trim() || "Sự Kiện & Khuyến Mãi Nổi Bật";
  const ctaText = config?.ctaText?.trim() || "Khám phá";
  const anchorCtaText = config?.anchorCtaText?.trim() || "Xem ngay";

  const [dismissed, setDismissed] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const timerRef = useRef(null);

  // Xử lý vuốt chạm trên Mobile
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const isDraggingOrScrolling = useRef(false);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (banners.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIdx((prev) => (prev + 1) % banners.length);
      }, 6000);
    }
  }, [banners.length]);

  const goToNext = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % banners.length);
    resetTimer();
  }, [banners.length, resetTimer]);

  const goToPrev = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + banners.length) % banners.length);
    resetTimer();
  }, [banners.length, resetTimer]);

  // Auto-rotate mỗi 6 giây khi có từ 2 banner trở lên
  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  if (dismissed || banners.length === 0) return null;

  const currentBanner = banners[currentIdx] || banners[0];

  const handleAction = (e) => {
    if (!currentBanner?.linkUrl) return;

    const link = currentBanner.linkUrl.trim();

    // Hỗ trợ anchor nội bộ (ví dụ: #download, #features, #how-it-works)
    if (link.startsWith("#")) {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      const targetElement = document.querySelector(link);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.hash = link;
      }
      return;
    }

    // Link ngoài thông thường (http://, https://)
    window.open(link, "_blank", "noopener,noreferrer");
  };

  // Bắt đầu chạm ngón tay trên mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    isDraggingOrScrolling.current = false;
  };

  // Di chuyển ngón tay (phân biệt cuộn trang hay vuốt đổi banner)
  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
      isDraggingOrScrolling.current = true;
    }
  };

  // Thả ngón tay
  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const timeTaken = Date.now() - touchStartRef.current.time;

    // Nếu vuốt ngang dứt khoát (> 40px và theo phương ngang hơn là cuộn dọc)
    if (
      banners.length > 1 &&
      Math.abs(deltaX) > 40 &&
      Math.abs(deltaX) > Math.abs(deltaY) &&
      timeTaken < 600
    ) {
      if (deltaX < 0) {
        goToNext(); // Vuốt sang trái -> xem banner kế tiếp
      } else {
        goToPrev(); // Vuốt sang phải -> xem banner trước đó
      }
    }
  };

  const handleCardClick = (e) => {
    // Nếu người dùng vừa thực hiện vuốt (swipe) hoặc cuộn màn hình, không kích hoạt click mở link
    if (isDraggingOrScrolling.current) {
      isDraggingOrScrolling.current = false;
      return;
    }
    handleAction(e);
  };

  return (
    <section className="py-5 sm:py-6 px-4 sm:px-6 relative overflow-hidden" aria-label="Sự kiện và Khuyến mãi">
      <div className="max-w-6xl mx-auto">
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleCardClick}
          className={`group relative overflow-hidden rounded-3xl backdrop-blur-xl p-5 sm:p-6 transition-all duration-300 border select-none touch-pan-y ${
            isDark
              ? "border-pink-500/20 bg-gradient-to-r from-pink-950/25 via-purple-950/20 to-[#121020]/50 shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:border-pink-500/40 hover:shadow-[0_8px_35px_rgba(236,72,153,0.15)]"
              : "border-pink-200/90 bg-gradient-to-r from-pink-50/95 via-white to-rose-50/80 shadow-[0_10px_30px_rgba(244,114,182,0.15)] hover:border-pink-300 hover:shadow-[0_12px_35px_rgba(244,114,182,0.2)]"
          } ${currentBanner.linkUrl ? "cursor-pointer" : ""}`}
        >
          {/* Background ambient glow effect */}
          <div
            className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors ${
              isDark ? "bg-pink-500/10" : "bg-pink-300/20"
            }`}
          />
          <div
            className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors ${
              isDark ? "bg-purple-500/10" : "bg-rose-200/25"
            }`}
          />

          {/* Close button [X] */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            title="Đóng dải banner"
            aria-label="Đóng dải thông báo"
            className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-sm shadow-sm ${
              isDark
                ? "bg-white/10 hover:bg-white/20 text-white/60 hover:text-white active:scale-95"
                : "bg-gray-200/80 hover:bg-gray-300 text-gray-500 hover:text-gray-800 active:scale-95"
            }`}
          >
            <X size={15} />
          </button>

          {/* Side Navigation Arrows for multi-banners on Desktop hover */}
          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                aria-label="Banner trước"
                className={`hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${
                  isDark
                    ? "bg-black/50 hover:bg-black/80 text-white/80 hover:text-white"
                    : "bg-white/90 hover:bg-white text-gray-700 hover:text-black shadow-md"
                }`}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                aria-label="Banner kế tiếp"
                className={`hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${
                  isDark
                    ? "bg-black/50 hover:bg-black/80 text-white/80 hover:text-white"
                    : "bg-white/90 hover:bg-white text-gray-700 hover:text-black shadow-md"
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Content Layout */}
          <div className="flex flex-col md:flex-row items-center gap-6 z-10 relative">
            {/* Banner Image with Reserved Aspect Ratio */}
            <div
              className={`w-full md:w-80 lg:w-96 flex-shrink-0 aspect-[16/8] rounded-2xl overflow-hidden shadow-md relative border ${
                isDark ? "bg-white/5 border-white/10" : "bg-pink-50 border-pink-100"
              }`}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentBanner.bannerId || currentIdx}
                  src={currentBanner.imageUrl}
                  alt={currentBanner.title}
                  loading="lazy"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                />
              </AnimatePresence>
            </div>

            {/* Text details */}
            <div className="flex-1 min-w-0 text-center md:text-left pr-0 md:pr-4">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2.5 border transition-colors ${
                  isDark
                    ? "bg-pink-500/20 text-pink-300 border-pink-500/30"
                    : "bg-pink-100 text-pink-600 border-pink-200"
                }`}
              >
                <Sparkles size={12} className={isDark ? "text-pink-400" : "text-pink-500"} />
                <span>{badgeText}</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBanner.bannerId || currentIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3
                    className={`text-lg sm:text-2xl font-bold tracking-tight line-clamp-1 transition-colors ${
                      isDark
                        ? "text-white group-hover:text-pink-300"
                        : "text-gray-900 group-hover:text-pink-600"
                    }`}
                  >
                    {currentBanner.title}
                  </h3>
                  {currentBanner.subtitle && (
                    <p
                      className={`text-xs sm:text-sm mt-1.5 line-clamp-2 leading-relaxed font-normal transition-colors ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {currentBanner.subtitle}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Action CTA Button — dịch sang trái (sm:mr-12) để hoàn toàn không bị nút mũi tên [ > ] đè lên */}
            {currentBanner.linkUrl && (
              <div className="flex-shrink-0 mt-2 md:mt-0 sm:mr-12">
                <span className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-pink-500/25 group-hover:scale-105 active:scale-95 transition-all">
                  <span>{currentBanner.linkUrl.trim().startsWith("#") ? anchorCtaText : ctaText}</span>
                  {currentBanner.linkUrl.trim().startsWith("#") ? (
                    <ChevronDown size={15} />
                  ) : (
                    <ExternalLink size={14} />
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Dots Indicator & Quick Controls when having multiple banners */}
          {banners.length > 1 && (
            <div
              className={`flex justify-between items-center mt-4 pt-3 border-t ${
                isDark ? "border-white/10" : "border-pink-100"
              }`}
            >
              {/* Pagination Dots */}
              <div className="flex items-center gap-2">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIdx(i);
                      resetTimer();
                    }}
                    aria-label={`Chuyển đến banner ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIdx
                        ? "w-8 bg-pink-500"
                        : isDark
                        ? "w-2 bg-white/20 hover:bg-white/40"
                        : "w-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>

              {/* Mobile swipe hint */}
              <div className="text-[11px] text-gray-400 sm:hidden flex items-center gap-1 font-medium">
                <span>Vuốt để xem thêm</span>
                <span>→</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
