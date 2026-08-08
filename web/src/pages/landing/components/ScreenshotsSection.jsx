import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Wifi, Battery, Signal } from "lucide-react";

/** iPhone 15 Pro style frame */
function IPhoneMockup({ imageUrl, alt, isCenter }) {
  return (
    <div
      className={`relative flex-shrink-0 transition-all duration-500 ${
        isCenter ? "w-[230px] z-10" : "w-[190px] z-0"
      }`}
    >
      {/* Outer frame — titanium look */}
      <div
        className={`relative rounded-[44px] transition-all duration-500 ${
          isCenter
            ? "shadow-[0_30px_80px_rgba(0,0,0,0.45),0_0_0_2px_rgba(160,160,180,0.3)]"
            : "shadow-[0_16px_40px_rgba(0,0,0,0.25),0_0_0_1.5px_rgba(160,160,180,0.15)]"
        }`}
        style={{
          background: "linear-gradient(145deg, #2a2a2e 0%, #1c1c1e 40%, #2a2a2e 100%)",
          padding: "2px",
        }}
      >
        {/* Inner screen container */}
        <div className="relative rounded-[42px] overflow-hidden bg-black aspect-[9/19.5]">

          {/* Status bar */}
          <div className="absolute top-0 inset-x-0 z-20 px-5 pt-3.5 pb-1 flex items-center justify-between">
            {/* Time */}
            <span className="text-white text-[11px] font-semibold leading-none">9:41</span>
            {/* Dynamic Island */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-full z-30" />
            {/* Status icons */}
            <div className="flex items-center gap-1">
              <Signal size={10} className="text-white" />
              <Wifi size={10} className="text-white" />
              <Battery size={11} className="text-white" />
            </div>
          </div>

          {/* Screen content */}
          <div className="absolute inset-0 top-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={alt}
                className="w-full h-full object-cover"
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
            <div className="w-28 h-1 rounded-full bg-white/40" />
          </div>

          {/* Side button (Action button) hint */}
          <div className="absolute -right-[2px] top-[80px] w-[3px] h-[32px] rounded-r bg-[#3a3a3c]" />

          {/* Volume buttons */}
          <div className="absolute -left-[2px] top-[80px] w-[3px] h-[28px] rounded-l bg-[#3a3a3c]" />
          <div className="absolute -left-[2px] top-[120px] w-[3px] h-[50px] rounded-l bg-[#3a3a3c]" />
          <div className="absolute -left-[2px] top-[182px] w-[3px] h-[50px] rounded-l bg-[#3a3a3c]" />

          {/* Screen glass glare */}
          <div className="absolute inset-0 pointer-events-none rounded-[42px]"
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
  const { title = "Giao diện ứng dụng", images = [] } = data || {};
  const [active, setActive] = useState(0);

  const prev = () => setActive((a) => (a - 1 + images.length) % images.length);
  const next = () => setActive((a) => (a + 1) % images.length);

  return (
    <section
      id="screenshots"
      className="py-28 overflow-hidden"
      style={{ background: "var(--lp-bg-alt)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span
            style={{
              background: "var(--lp-badge-bg)",
              color: "var(--lp-badge-text)",
              border: "1px solid var(--lp-badge-border)",
            }}
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
          >
            Ứng dụng
          </span>
          <h2 style={{ color: "var(--lp-text)" }} className="text-3xl sm:text-4xl font-bold">{title}</h2>
          <p style={{ color: "var(--lp-text-faint)" }} className="mt-3 text-sm">Vuốt để khám phá các màn hình</p>
        </motion.div>

        {/* Phone carousel */}
        <div className="flex items-center justify-center gap-4">
          {/* Prev */}
          <button
            onClick={prev}
            style={{ background: "var(--lp-bg-card)", borderColor: "var(--lp-border)", color: "var(--lp-text-muted)" }}
            className="w-10 h-10 flex-shrink-0 rounded-full border backdrop-blur flex items-center justify-center hover:border-pink-400 hover:text-pink-500 hover:scale-105 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Phones — show prev, active, next */}
          <div className="flex items-center justify-center gap-3 overflow-visible py-6">
            {images.map((img, i) => {
              const offset = (i - active + images.length) % images.length;
              // Show center, prev (-1), next (+1) only
              const isCenter = offset === 0;
              const isSide   = offset === 1 || offset === images.length - 1;
              if (!isCenter && !isSide) return null;

              const scale   = isCenter ? 1    : 0.8;
              const opacity = isCenter ? 1    : 0.5;
              const yOff    = isCenter ? 0    : 28;

              return (
                <motion.div
                  key={i}
                  animate={{ scale, opacity, y: yOff }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onClick={() => setActive(i)}
                  className="cursor-pointer"
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
            className="w-10 h-10 flex-shrink-0 rounded-full border backdrop-blur flex items-center justify-center hover:border-pink-400 hover:text-pink-500 hover:scale-105 transition-all shadow-sm"
          >
            <ChevronRight size={20} />
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
