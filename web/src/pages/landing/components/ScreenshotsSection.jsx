import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

function PhoneMockup({ imageUrl, alt }) {
  return (
    <div className="relative w-[220px] flex-shrink-0">
      {/* Phone frame */}
      <div className="relative w-full aspect-[9/19.5] rounded-[32px] bg-gray-900 border-4 border-gray-800 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 inset-x-0 h-7 bg-gray-900 z-10 flex justify-center items-end pb-1">
          <div className="w-20 h-4 rounded-full bg-gray-800" />
        </div>
        {/* Screen */}
        <div className="absolute inset-0 top-7">
          {imageUrl ? (
            <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center gap-2">
              <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center">
                <span className="text-pink-400 text-2xl">📱</span>
              </div>
              <p className="text-gray-500 text-xs text-center px-4">{alt}</p>
            </div>
          )}
        </div>
        {/* Home bar */}
        <div className="absolute bottom-2 inset-x-0 flex justify-center z-10">
          <div className="w-20 h-1 rounded-full bg-white/30" />
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
    <section id="screenshots" className="py-24 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-600 border border-pink-100 mb-4">
            Ứng dụng
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h2>
        </motion.div>

        {/* Carousel */}
        <div className="flex items-center justify-center gap-6">
          {/* Prev */}
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-pink-300 hover:text-pink-500 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Phones */}
          <div className="flex items-center gap-4 overflow-visible">
            {images.map((img, i) => {
              const offset = i - active;
              const isCenter = offset === 0;
              return (
                <motion.div
                  key={i}
                  animate={{
                    scale: isCenter ? 1 : 0.82,
                    opacity: isCenter ? 1 : 0.45,
                    y: isCenter ? 0 : 24,
                  }}
                  transition={{ duration: 0.35 }}
                  onClick={() => setActive(i)}
                  className="cursor-pointer"
                >
                  <PhoneMockup imageUrl={img.url} alt={img.alt} />
                </motion.div>
              );
            })}
          </div>

          {/* Next */}
          <button
            onClick={next}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-pink-300 hover:text-pink-500 transition-colors"
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
                className={`h-1.5 rounded-full transition-all ${
                  i === active
                    ? "w-6 bg-pink-500"
                    : "w-1.5 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        )}

        {/* Alt text */}
        {images[active] && (
          <p className="text-center text-gray-400 text-sm mt-4">{images[active].alt}</p>
        )}
      </div>
    </section>
  );
}
