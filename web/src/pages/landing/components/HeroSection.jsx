import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Download } from "lucide-react";
import DynamicIcon from "@/components/DynamicIcon";

export default function HeroSection({ data }) {
  const {
    badge       = "Thuyết minh du lịch bằng âm thanh",
    heading1    = "Khám Phá Phố Ẩm Thực",
    heading2    = "Qua Từng Câu Chuyện",
    description = "Ứng dụng thuyết minh tự động theo vị trí cho Phố Ẩm Thực Vĩnh Khánh Q4.",
    cta1Text    = "Tải App Android",
    cta1Link    = "#download",
    cta2Text    = "Xem cách hoạt động",
    cta2Link    = "#how-it-works",
    backgroundImages      = [],   // mảng { url, alt }
    backgroundImageUrl    = "",   // legacy compat
    stats                 = [],
  } = data || {};

  // Resolve danh sách ảnh nền — hỗ trợ cả schema mới lẫn legacy
  const bgList = backgroundImages?.length
    ? backgroundImages.filter((b) => b.url)
    : backgroundImageUrl
      ? [{ url: backgroundImageUrl, alt: "AudioGo Hero Background" }]
      : [];

  const [bgIndex, setBgIndex] = useState(0);

  // Auto-slide mỗi 5s
  const tick = useCallback(() => {
    if (bgList.length > 1) setBgIndex((i) => (i + 1) % bgList.length);
  }, [bgList.length]);

  useEffect(() => {
    if (bgList.length <= 1) return;
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, [tick]);

  const scrollTo = (href) => {
    if (!href?.startsWith("#")) { window.open(href, "_blank"); return; }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background slideshow with high-priority semantic images */}
      <AnimatePresence mode="sync">
        {bgList.length > 0 ? (
          <motion.div
            key={bgIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <img
              src={bgList[bgIndex].url}
              alt={bgList[bgIndex].alt || "AudioGo Vĩnh Khánh Q4 Hero"}
              fetchPriority={bgIndex === 0 ? "high" : "auto"}
              loading={bgIndex === 0 ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#1a0a14] to-[#0d0d1a]" />
        )}
      </AnimatePresence>

      {/* Slideshow dots */}
      {bgList.length > 1 && (
        <div className="absolute bottom-16 sm:bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {bgList.map((_, i) => (
            <button
              key={i}
              onClick={() => setBgIndex(i)}
              aria-label={`Chuyển đến slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === bgIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Decorative orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-pink-600/20 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-orange-500/15 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-purple-900/10 blur-[120px]" />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 z-[2]" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-16 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs sm:text-sm font-medium mb-4 sm:mb-6"
        >
          {badge}
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight sm:leading-tight tracking-tight break-words"
        >
          <span className="text-white">{heading1}</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400">
            {heading2}
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed px-2"
        >
          {description}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-xs sm:max-w-none mx-auto w-full"
        >
          <button
            onClick={() => scrollTo(cta1Link)}
            className="group flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold text-sm sm:text-base bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-600/30 hover:shadow-pink-600/50 hover:scale-[1.03] active:scale-[0.97] transition-all w-full sm:w-auto"
          >
            <Download size={18} />
            {cta1Text}
          </button>
          <button
            onClick={() => scrollTo(cta2Link)}
            className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-medium text-sm sm:text-base border border-white/30 text-white/90 hover:bg-white/10 hover:border-white/50 transition-all w-full sm:w-auto"
          >
            {cta2Text}
          </button>
        </motion.div>

        {/* Stats pills */}
        {stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15"
              >
                <DynamicIcon name={stat.icon} size={14} className="text-orange-400" />
                <span className="text-white font-bold text-xs sm:text-sm">{stat.value}</span>
                <span className="text-white/60 text-xs sm:text-sm">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-10 sm:mt-16 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="text-white/40"
          >
            <ChevronDown size={28} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
