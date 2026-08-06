import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, MessageCircle } from "lucide-react";

export default function FloatingButtons({ apkUrl, zaloLink }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-6 right-4 z-50 flex flex-col gap-3"
        >
          {/* Zalo */}
          {zaloLink && (
            <a
              href={zaloLink}
              target="_blank"
              rel="noreferrer"
              className="group w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
              title="Chat Zalo"
            >
              <MessageCircle size={20} className="text-white" />
            </a>
          )}

          {/* Tải App */}
          {apkUrl && (
            <a
              href={apkUrl}
              download
              className="group flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.04] active:scale-[0.96] transition-all text-sm font-semibold whitespace-nowrap"
              title="Tải App"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Tải App</span>
            </a>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
