import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Sparkles } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

/**
 * BannerStripSection — Hiển thị banner sự kiện / khuyến mãi nổi bật trên Landing Page.
 * Hỗ trợ hoàn hảo cả Dark Mode & Light Mode (tương thích theo ThemeContext).
 */
export default function BannerStripSection({ banners = [] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [dismissed, setDismissed] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const timerRef = useRef(null);

  // Auto-rotate mỗi 6 giây khi có từ 2 banner trở lên
  useEffect(() => {
    if (banners.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % banners.length);
    }, 6000);

    return () => clearInterval(timerRef.current);
  }, [banners.length]);

  if (dismissed || banners.length === 0) return null;

  const currentBanner = banners[currentIdx] || banners[0];

  const handleAction = () => {
    if (currentBanner.linkUrl) {
      window.open(currentBanner.linkUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section className="py-5 sm:py-6 px-4 sm:px-6 relative overflow-hidden" aria-label="Sự kiện và Khuyến mãi">
      <div className="max-w-6xl mx-auto">
        <div
          onClick={handleAction}
          className={`group relative overflow-hidden rounded-3xl backdrop-blur-xl p-5 sm:p-6 transition-all duration-300 border ${
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

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            aria-label="Đóng banner"
            className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-sm ${
              isDark
                ? "bg-white/10 hover:bg-white/20 text-white/60 hover:text-white"
                : "bg-gray-200/80 hover:bg-gray-300 text-gray-500 hover:text-gray-800"
            }`}
          >
            <X size={15} />
          </button>

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
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </AnimatePresence>
            </div>

            {/* Text details */}
            <div className="flex-1 min-w-0 text-center md:text-left pr-0 md:pr-10">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2.5 border transition-colors ${
                  isDark
                    ? "bg-pink-500/20 text-pink-300 border-pink-500/30"
                    : "bg-pink-100 text-pink-600 border-pink-200"
                }`}
              >
                <Sparkles size={12} className={isDark ? "text-pink-400" : "text-pink-500"} />
                <span>Sự Kiện & Khuyến Mãi Nổi Bật</span>
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

            {/* Action CTA Button */}
            {currentBanner.linkUrl && (
              <div className="flex-shrink-0 mt-2 md:mt-0">
                <span className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-pink-500/25 group-hover:scale-105 active:scale-95 transition-all">
                  <span>Khám phá</span>
                  <ExternalLink size={14} />
                </span>
              </div>
            )}
          </div>

          {/* Dots Indicator when having multiple banners */}
          {banners.length > 1 && (
            <div
              className={`flex justify-center md:justify-start items-center gap-2 mt-4 pt-3 border-t ${
                isDark ? "border-white/10" : "border-pink-100"
              }`}
            >
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIdx(i);
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
          )}
        </div>
      </div>
    </section>
  );
}
