import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Wifi, Battery, Signal } from "lucide-react";

/** iPhone 15 Pro style frame */
function IPhoneMockup({ imageUrl, alt, isCenter }) {
  return (
    <div
      className={`relative flex-shrink-0 transition-all duration-500 select-none ${
        isCenter ? "w-[205px] sm:w-[230px] z-10" : "w-[125px] sm:w-[190px] z-0"
      }`}
    >
      {/* Outer frame — titanium look */}
      <div
        className={`relative rounded-[36px] sm:rounded-[44px] transition-all duration-500 ${
          isCenter
            ? "shadow-[0_20px_50px_rgba(0,0,0,0.4),0_0_0_2px_rgba(160,160,180,0.3)] sm:shadow-[0_30px_80px_rgba(0,0,0,0.45),0_0_0_2px_rgba(160,160,180,0.3)]"
            : "shadow-[0_12px_30px_rgba(0,0,0,0.2),0_0_0_1.5px_rgba(160,160,180,0.15)]"
        }`}
        style={{
          background: "linear-gradient(145deg, #2a2a2e 0%, #1c1c1e 40%, #2a2a2e 100%)",
          padding: "2px",
        }}
      >
        {/* Inner screen container */}
        <div className="relative rounded-[34px] sm:rounded-[42px] overflow-hidden bg-black aspect-[9/19.5]">

          {/* Status bar */}
          <div className="absolute top-0 inset-x-0 z-20 px-4 sm:px-5 pt-2.5 sm:pt-3.5 pb-1 flex items-center justify-between">
            {/* Time */}
            <span className="text-white text-[10px] sm:text-[11px] font-semibold leading-none">9:41</span>
            {/* Dynamic Island */}
            <div className="absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 w-[70px] sm:w-[90px] h-[20px] sm:h-[26px] bg-black rounded-full z-30" />
            {/* Status icons */}
            <div className="flex items-center gap-1">
              <Signal size={9} className="text-white sm:w-2.5 sm:h-2.5" />
              <Wifi size={9} className="text-white sm:w-2.5 sm:h-2.5" />
              <Battery size={10} className="text-white sm:w-3 sm:h-3" />
            </div>
          </div>

          {/* Screen content */}
          <div className="absolute inset-0 top-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={alt || "Ảnh chụp màn hình ứng dụng AudioGo thuyết minh ẩm thực Vĩnh Khánh"}
                loading="lazy"
                draggable={false}
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1a0a14] to-[#0d0d1a] flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <div className="w-6 h-6 rounded bg-pink-400/60" />
                </div>
                <p className="text-white/30 text-xs text-center px-6 leading-relaxed">{alt || "App screen"}</p>
              </div>
            )}
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 inset-x-0 flex justify-center z-20">
            <div className="w-20 sm:w-28 h-1 rounded-full bg-white/40" />
          </div>

          {/* Side button (Action button) hint */}
          <div className="absolute -right-[2px] top-[70px] sm:top-[80px] w-[3px] h-[26px] sm:h-[32px] rounded-r bg-[#3a3a3c]" />

          {/* Volume buttons */}
          <div className="absolute -left-[2px] top-[70px] sm:top-[80px] w-[3px] h-[22px] sm:h-[28px] rounded-l bg-[#3a3a3c]" />
          <div className="absolute -left-[2px] top-[102px] sm:top-[120px] w-[3px] h-[40px] sm:h-[50px] rounded-l bg-[#3a3a3c]" />
          <div className="absolute -left-[2px] top-[152px] sm:top-[182px] w-[3px] h-[40px] sm:h-[50px] rounded-l bg-[#3a3a3c]" />

          {/* Screen glass glare */}
          <div className="absolute inset-0 pointer-events-none rounded-[34px] sm:rounded-[42px]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ScreenshotsSection({ data }) {
  const { title = "Giao diện ứng dụng", images = [], badge = "Ứng dụng", subtitle = "Vuốt để khám phá các màn hình" } = data || {};
  const [active, setActive] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);

  const prev = () => setActive((a) => (a - 1 + images.length) % images.length);
  const next = () => setActive((a) => (a + 1) % images.length);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = touchStartY - e.changedTouches[0].clientY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) {
        next();
      } else {
        prev();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  return (
    <section
      id="screenshots"
      className="py-16 sm:py-28 overflow-hidden"
      style={{ background: "var(--lp-bg-alt)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16"
        >
          <span
            style={{
              background: "var(--lp-badge-bg)",
              color: "var(--lp-badge-text)",
              border: "1px solid var(--lp-badge-border)",
            }}
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
          >
            {badge}
          </span>
          <h2 style={{ color: "var(--lp-text)" }} className="text-2xl sm:text-4xl font-bold">{title}</h2>
          <p style={{ color: "var(--lp-text-faint)" }} className="mt-2 sm:mt-3 text-xs sm:text-sm">{subtitle}</p>
        </motion.div>

        {/* Phone carousel */}
        <div 
          className="flex items-center justify-center gap-2 sm:gap-4 touch-pan-y select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Prev */}
          <button
            onClick={prev}
            style={{ background: "var(--lp-bg-card)", borderColor: "var(--lp-border)", color: "var(--lp-text-muted)" }}
            className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full border backdrop-blur flex items-center justify-center hover:border-pink-400 hover:text-pink-500 hover:scale-105 active:scale-95 transition-all shadow-sm z-20"
            aria-label="Ảnh trước"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Phones — show prev, active, next */}
          <div className="flex items-center justify-center gap-1 sm:gap-3 overflow-visible py-4 sm:py-6 cursor-grab active:cursor-grabbing">
            {images.map((img, i) => {
              const offset = (i - active + images.length) % images.length;
              // Show center, prev (-1), next (+1) only
              const isCenter = offset === 0;
              const isSide   = offset === 1 || offset === images.length - 1;
              if (!isCenter && !isSide) return null;

              const scale   = isCenter ? 1    : 0.8;
              const opacity = isCenter ? 1    : 0.45;
              const yOff    = isCenter ? 0    : 20;

              return (
                <motion.div
                  key={i}
                  animate={{ scale, opacity, y: yOff }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onClick={() => setActive(i)}
                  drag={isCenter ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.25}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -35 || info.velocity.x < -250) {
                      next();
                    } else if (info.offset.x > 35 || info.velocity.x > 250) {
                      prev();
                    }
                  }}
                  className="cursor-pointer touch-pan-y"
                >
                  <IPhoneMockup imageUrl={img.url} alt={img.alt} isCenter={isCenter} />
                </motion.div>
              );
            })}
          </div>

          {/* Next */}
          <button
            onClick={next}
            style={{ background: "var(--lp-bg-card)", borderColor: "var(--lp-border)", color: "var(--lp-text-muted)" }}
            className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full border backdrop-blur flex items-center justify-center hover:border-pink-400 hover:text-pink-500 hover:scale-105 active:scale-95 transition-all shadow-sm z-20"
            aria-label="Ảnh kế tiếp"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dots */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? "w-6 bg-pink-500" : "w-1.5 bg-pink-200 hover:bg-pink-300"
                }`}
              />
            ))}
          </div>
        )}

        {/* Caption */}
        <AnimatePresence mode="wait">
          {images[active] && (
            <motion.p
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-center text-sm mt-5"
              style={{ color: "var(--lp-text-faint)" }}
            >
              {images[active].alt}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
