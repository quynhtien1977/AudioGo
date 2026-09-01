import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import DynamicIcon from "@/components/DynamicIcon";
import HeroSpotlightCard from "./HeroSpotlightCard";

/**
 * HeroSection — Modernized Cinematic Hero with Asymmetric Layout,
 * Floating Glass Spotlight Card, Touch Swipe gestures for Mobile,
 * Fraction Scrubber Pagination & Raw Stats.
 */
export default function HeroSection({
  data,
  banners = [],
  bannerConfig = {},
  lang = "vi",
  showSpotlight = true,
}) {
  const {
    badge = "Thuyết minh du lịch & ẩm thực bằng âm thanh",
    heading1 = "Khám Phá Phố Ẩm Thực",
    heading2 = "Qua Từng Câu Chuyện",
    description = "Ứng dụng thuyết minh tự động theo vị trí GPS cho Phố Ẩm Thực Vĩnh Khánh Q4 và các điểm đến di sản. Tự động phát âm thanh khi bạn đến gần quán.",
    cta1Text = "Tải App Android",
    cta1Link = "#download",
    cta2Text = "Xem cách hoạt động",
    cta2Link = "#how-it-works",
    backgroundImages = [],
    backgroundImageUrl = "",
    stats = [],
  } = data || {};

  // Resolve slides: kết hợp ảnh nền và danh sách banner nổi bật nếu có
  const slides = useMemo(() => {
    const rawBgs = backgroundImages?.length
      ? backgroundImages.filter((b) => b.url)
      : backgroundImageUrl
      ? [{ url: backgroundImageUrl, alt: "AudioGo Hero Background" }]
      : [{ url: "/asset/loginImg.webp", alt: "Phố Ẩm Thực Vĩnh Khánh Q4" }];

    // Default POI showcase cards if no custom metadata is provided
    const defaultSpotlights = [
      {
        tag: "Điểm Đến Nổi Bật",
        title: "Phố Ẩm Thực Vĩnh Khánh",
        subtitle: "Thiên đường hải sản & ốc đêm sôi động bậc nhất Quận 4.",
        ctaText: "Khám phá ngay",
        link: "#how-it-works",
      },
      {
        tag: "Di Tích Lịch Sử",
        title: "Bến Nhà Rồng — Bảo Tàng HCM",
        subtitle: "Nơi Bác Hồ ra đi tìm đường cứu nước bên dòng sông Sài Gòn.",
        ctaText: "Nghe thuyết minh",
        link: "#features",
      },
      {
        tag: "Quán Ăn Trứ Danh",
        title: "Ốc Oanh Vĩnh Khánh",
        subtitle: "Đặc sản ốc hương hoàng kim và hải sản tươi sống mỗi đêm.",
        ctaText: "Xem vị trí",
        link: "#screenshots",
      },
      {
        tag: "Trải Nghiệm Audio Guide",
        title: "Tự Động Kích Hoạt Qua GPS",
        subtitle: "Đi tới đâu nghe thuyết minh tới đó, hỗ trợ 7 ngôn ngữ quốc tế.",
        ctaText: "Tải ứng dụng",
        link: "#download",
      },
    ];

    return rawBgs.map((bg, idx) => {
      // Ưu tiên liên kết với banner thật nếu có từ CMS Banners
      const matchedBanner = banners[idx % Math.max(1, banners.length)];
      if (matchedBanner) {
        let bTitle = matchedBanner.title || "";
        let bSubtitle = matchedBanner.subtitle || "";
        if (lang !== "vi") {
          try {
            const tMap = typeof matchedBanner.titleTranslations === "string"
              ? JSON.parse(matchedBanner.titleTranslations)
              : matchedBanner.titleTranslations;
            const sMap = typeof matchedBanner.subtitleTranslations === "string"
              ? JSON.parse(matchedBanner.subtitleTranslations)
              : matchedBanner.subtitleTranslations;
            if (tMap?.[lang]) bTitle = tMap[lang];
            if (sMap?.[lang]) bSubtitle = sMap[lang];
          } catch {
            // fallback to vi
          }
        }

        return {
          id: `banner-${matchedBanner.bannerId || idx}`,
          bgUrl: bg.url || matchedBanner.imageUrl || "/asset/loginImg.webp",
          alt: bg.alt || bTitle || "AudioGo Spotlight",
          thumbUrl: matchedBanner.imageUrl || bg.url,
          tag: "Sự Kiện & Khuyến Mãi",
          title: bTitle || defaultSpotlights[idx % defaultSpotlights.length].title,
          subtitle: bSubtitle || defaultSpotlights[idx % defaultSpotlights.length].subtitle,
          ctaText: "Xem chi tiết",
          link: matchedBanner.linkUrl || "#consult",
          isBanner: true,
        };
      }

      const defaultMeta = defaultSpotlights[idx % defaultSpotlights.length];
      return {
        id: `slide-${idx}`,
        bgUrl: bg.url,
        alt: bg.alt || defaultMeta.title,
        thumbUrl: bg.url,
        tag: defaultMeta.tag,
        title: bg.title || defaultMeta.title,
        subtitle: bg.subtitle || defaultMeta.subtitle,
        ctaText: defaultMeta.ctaText,
        link: defaultMeta.link,
        isBanner: false,
      };
    });
  }, [backgroundImages, backgroundImageUrl, banners, lang]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const totalSlides = Math.max(1, slides.length);

  // Auto slide ticker mỗi 6 giây
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide, totalSlides, isPaused]);

  // Touch Swipe Gesture Handling (Vuốt cảm ứng mượt mà trên Mobile & Tablet)
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);

  const handleTouchStart = (e) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const isSwipeLeft = distance > 50;
    const isSwipeRight = distance < -50;

    if (isSwipeLeft) {
      nextSlide();
    } else if (isSwipeRight) {
      prevSlide();
    }

    touchStartRef.current = 0;
    touchEndRef.current = 0;
  };

  const scrollTo = (href) => {
    if (!href) return;
    if (!href.startsWith("#")) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const currentSlide = slides[currentIndex] || slides[0];

  // Resolve default stats nếu rỗng
  const displayStats = stats?.length
    ? stats
    : [
        { icon: "MapPin", value: "30+", label: "Điểm thuyết minh" },
        { icon: "Globe", value: "7", label: "Ngôn ngữ đa quốc gia" },
        { icon: "Headphones", value: "100%", label: "Tự động kích hoạt GPS" },
      ];

  // Format 2 chữ số (01, 02...)
  const padNumber = (num) => String(num).padStart(2, "0");

  return (
    <section
      id="hero"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0B0F19] text-white select-none"
    >
      {/* ── Background Slideshow with Smooth Crossfade & Scale ─────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <AnimatePresence mode="sync">
          <motion.div
            key={currentSlide?.bgUrl || currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <img
              src={currentSlide?.bgUrl}
              alt={currentSlide?.alt || "AudioGo Hero Background"}
              width="1920"
              height="1080"
              fetchPriority={currentIndex === 0 ? "high" : "auto"}
              loading={currentIndex === 0 ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>

        {/* Cinematic Gradient Overlays (Coral Sunset on Midnight) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19]/95 via-[#0B0F19]/70 to-[#0B0F19]/45 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-[#0B0F19]/60 z-[1]" />

        {/* Ambient Warm Culinary Sunset Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-rose-600/20 blur-[110px] z-[2]" />
        <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-[120px] z-[2]" />
      </div>

      {/* ── Main Hero Content Wrapper ───────────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-h-screen flex flex-col justify-between pt-28 sm:pt-32 pb-10 sm:pb-12">
        {/* Top/Middle Section: Asymmetric Split Grid with Baseline Alignment to CTAs */}
        <div className={`grid grid-cols-1 ${showSpotlight ? "lg:grid-cols-12 gap-8 lg:gap-12" : "max-w-3xl"} items-end my-auto`}>
          {/* Left Column (Main Copy & CTAs) */}
          <div className={`${showSpotlight ? "lg:col-span-7" : "w-full"} flex flex-col items-start text-left`}>
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/95 text-xs sm:text-sm font-medium mb-4 sm:mb-6 shadow-lg shadow-black/20"
            >
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <span>{badge}</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-[68px] font-extrabold leading-[1.12] sm:leading-[1.1] tracking-tight text-white"
            >
              <span>{heading1}</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-coral-400 to-amber-300 drop-shadow-sm">
                {heading2}
              </span>
            </motion.h1>

            {/* Description Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-white/80 max-w-xl leading-relaxed"
            >
              {description}
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto"
            >
              <button
                onClick={() => scrollTo(cta1Link)}
                className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-semibold text-sm sm:text-base bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-xl shadow-rose-600/30 hover:shadow-rose-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Download size={19} className="group-hover:-translate-y-0.5 transition-transform" />
                <span>{cta1Text}</span>
              </button>

              <button
                onClick={() => scrollTo(cta2Link)}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-sm sm:text-base bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/25 hover:border-white/40 text-white/95 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{cta2Text}</span>
              </button>
            </motion.div>
          </div>

          {/* Right Column: Hero Spotlight Card Component */}
          {showSpotlight && (
            <HeroSpotlightCard
              slide={currentSlide}
              currentIndex={currentIndex}
              totalSlides={totalSlides}
              bannerConfig={bannerConfig}
              lang={lang}
              onHoverChange={setIsPaused}
              onNavigate={scrollTo}
            />
          )}
        </div>

        {/* ── Bottom Section: Raw Typography Stats & Fraction Scrubber ───────── */}
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 sm:gap-8">
          {/* Left: Raw Metrics (Inspired by Image 01 — số to để trần, không bọc pill) */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-10 lg:gap-14">
            {displayStats.map((stat, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm text-white/60 font-medium mt-0.5">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Right: Fraction Scrubber Pagination + Prev/Next Controls (Cleaned for Mobile) */}
          {totalSlides > 1 && (
            <div className="flex items-center justify-end w-full md:w-auto gap-4">
              {/* Fraction + Animated Progress Line */}
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs sm:text-sm font-bold text-white/90">
                  {padNumber(currentIndex + 1)}
                </span>

                {/* Animated Line Scrubber */}
                <div className="relative w-20 sm:w-28 h-1 rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    key={currentIndex}
                    initial={{ width: "0%" }}
                    animate={{ width: isPaused ? undefined : "100%" }}
                    transition={{ duration: 6, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-rose-500 via-coral-400 to-amber-400 rounded-full"
                  />
                </div>

                <span className="font-mono text-xs sm:text-sm font-medium text-white/40">
                  {padNumber(totalSlides)}
                </span>
              </div>

              {/* Navigation Arrow Buttons — Hidden on Mobile for clean thumb swipe experience */}
              <div className="hidden sm:flex items-center gap-1.5 ml-2">
                <button
                  onClick={prevSlide}
                  aria-label="Slide trước"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={nextSlide}
                  aria-label="Slide kế tiếp"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
