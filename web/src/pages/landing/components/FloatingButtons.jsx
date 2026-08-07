import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Phone, Mail, ArrowUp, X, MessageCircle } from "lucide-react";

/* ── Social icons ── */
function ZaloIcon() {
  // Simple branded Zalo icon — white Z on Zalo blue
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: 4,
        background: "white",
        color: "#0068FF",
        fontWeight: 900,
        fontSize: 12,
        fontFamily: "Arial, sans-serif",
        lineHeight: 1,
        letterSpacing: "-0.5px",
        flexShrink: 0,
      }}
    >
      Za
    </span>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

/** Row trong panel liên hệ */
function ContactRow({ href, bg, icon, label, sub, target }) {
  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-gray-800 leading-tight">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 truncate">{sub}</p>}
      </div>
    </a>
  );
}

export default function FloatingButtons({ apkUrl, zaloLink, facebookLink, phone, email }) {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 300);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const backToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const hasContact = zaloLink || facebookLink || phone || email;

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2">

      {/* ─── Contact Card Panel ─── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden mb-1"
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-pink-500 to-orange-400">
              <p className="text-white font-bold text-sm leading-tight">Liên hệ AudioGo</p>
              <p className="text-white/80 text-xs mt-0.5">Chúng tôi sẵn sàng hỗ trợ bạn</p>
            </div>

            {/* Rows */}
            <div className="py-2 px-1">
              {phone && (
                <ContactRow
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  bg="bg-green-500"
                  icon={<Phone size={16} className="text-white" />}
                  label="Hotline"
                  sub={phone}
                />
              )}
              {zaloLink && (
                <ContactRow
                  href={zaloLink}
                  target="_blank"
                  bg="bg-[#0068FF]"
                  icon={<ZaloIcon />}
                  label="Zalo Chat"
                  sub="Chat ngay"
                />
              )}
              {facebookLink && (
                <ContactRow
                  href={facebookLink}
                  target="_blank"
                  bg="bg-[#1877F2]"
                  icon={<FacebookIcon />}
                  label="Facebook"
                  sub="Nhắn tin Fanpage"
                />
              )}
              {email && (
                <ContactRow
                  href={`mailto:${email}`}
                  bg="bg-orange-400"
                  icon={<Mail size={16} className="text-white" />}
                  label="Email"
                  sub={email}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Nút Tải App ─── */}
      {apkUrl && (
        <a
          href={apkUrl}
          download
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg hover:shadow-pink-500/40 hover:scale-[1.04] active:scale-95 transition-all text-sm font-semibold whitespace-nowrap"
          title="Tải App"
        >
          <Download size={15} />
          <span className="hidden sm:inline">Tải App</span>
        </a>
      )}

      {/* ─── Nút Back to top ─── */}
      <AnimatePresence>
        {scrolled && (
          <motion.button
            key="top"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            onClick={backToTop}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-400 hover:text-pink-500 hover:border-pink-300 hover:scale-110 transition-all"
            title="Về đầu trang"
          >
            <ArrowUp size={17} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Nút mở/đóng liên hệ ─── */}
      {hasContact && (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => setOpen((v) => !v)}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-xl transition-all ${
            open
              ? "bg-gray-700 shadow-gray-500/20"
              : "bg-gradient-to-r from-pink-500 to-orange-400 shadow-pink-500/30"
          }`}
          title={open ? "Đóng" : "Liên hệ"}
        >
          {/* Pulse khi đóng */}
          {!open && <span className="absolute inset-0 rounded-full bg-pink-400/20 animate-ping" />}

          {open
            ? <><X size={15} /><span>Đóng</span></>
            : <><MessageCircle size={15} /><span>Liên hệ</span></>
          }
        </motion.button>
      )}
    </div>
  );
}
