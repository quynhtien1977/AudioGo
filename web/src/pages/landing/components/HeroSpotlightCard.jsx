import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

/**
 * HeroSpotlightCard — Dedicated Glassmorphic Banner/POI Spotlight Component.
 * Supports dynamic CMS translations (badgeText, ctaText, anchorCtaText),
 * seamless banner data resolution, and smooth 3D layered hover effects.
 */
function HeroSpotlightCard({
  slide,
  currentIndex = 0,
  totalSlides = 1,
  bannerConfig = {},
  lang = "vi",
  onHoverChange,
  onNavigate,
}) {
  if (!slide) return null;

  const padNumber = (num) => String(num).padStart(2, "0");

  // Đa ngôn ngữ cho nhãn Huy hiệu (Badge) từ CMS config hoặc fallback thông minh
  const isBanner = Boolean(slide.isBanner);
  const isInternalLink = slide.link?.startsWith("#");

  const resolvedTag = isBanner
    ? bannerConfig?.badgeText?.trim() ||
      (lang === "en" ? "Special Events & Deals" : lang === "ja" ? "注目のイベント" : "Sự Kiện Nổi Bật")
    : lang === "en"
    ? "Featured Destination"
    : lang === "ja"
    ? "おすすめスポット"
    : slide.tag || "Điểm Đến Nổi Bật";

  // Đa ngôn ngữ cho nút bấm CTA
  const resolvedCtaText = isInternalLink
    ? bannerConfig?.anchorCtaText?.trim() ||
      (lang === "en" ? "Explore now" : lang === "ja" ? "詳しく見る" : slide.ctaText || "Khám phá ngay")
    : bannerConfig?.ctaText?.trim() ||
      (lang === "en" ? "View details" : lang === "ja" ? "詳細を見る" : slide.ctaText || "Xem chi tiết");

  return (
    <div className="lg:col-span-5 flex justify-center lg:justify-end items-end mt-8 lg:mt-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        onMouseEnter={() => onHoverChange?.(true)}
        onMouseLeave={() => onHoverChange?.(false)}
        className="relative w-full max-w-[400px] sm:max-w-[430px]"
      >
        {/* Backing decorative layered glow (Hiệu ứng 3D xếp lớp điện ảnh) */}
        <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-rose-500/25 to-amber-500/20 blur-xl opacity-60 pointer-events-none" />
        <div className="absolute top-2 -right-2 inset-0 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm -rotate-1 pointer-events-none hidden sm:block" />

        {/* Main Interactive Glass Card with Rich Landscape Banner Cover */}
        <div className="relative rounded-2xl bg-[#111827]/80 backdrop-blur-xl border border-white/20 p-3.5 sm:p-4 shadow-2xl shadow-black/80 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id || currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-3.5"
            >
              {/* Rich Landscape Cover Image (Tận dụng tối đa ảnh banner ngang sắc nét) */}
              <div className="relative w-full h-36 sm:h-44 rounded-xl overflow-hidden border border-white/15 shadow-inner group">
                <img
                  src={slide.thumbUrl}
                  alt={slide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  width="400"
                  height="176"
                />
                {/* Gradient overlay on image bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                {/* Floating Badge Tag inside Image */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-wide uppercase bg-black/60 backdrop-blur-md border border-white/20 text-rose-300 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    {resolvedTag}
                  </span>
                </div>
              </div>

              {/* Card Content & Action Button */}
              <div className="px-1 flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-1 group-hover:text-rose-400 transition-colors">
                    {slide.title}
                  </h4>
                </div>

                <p className="text-xs sm:text-sm text-white/70 line-clamp-2 leading-relaxed">
                  {slide.subtitle}
                </p>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate?.(slide.link)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer group"
                  >
                    <span>{resolvedCtaText}</span>
                    <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default memo(HeroSpotlightCard);
