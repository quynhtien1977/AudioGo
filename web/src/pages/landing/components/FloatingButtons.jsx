import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Phone, Mail, ArrowUp, X, MessageCircle } from "lucide-react";

/* ── Social icons ── */
function ZaloIcon() {
  // Logo Zalo chuẩn (trắng)
  return (
    <svg viewBox="0 0 460.1 436.6" width="18" height="18" fill="white">
      <path d="M230.1 0C103 0 0 89.2 0 199.1c0 59.9 29.6 113.6 76 150.7l-26 94.4c-2.4 8.6 6.8 15.6 14.5 10.9l104.9-63.5c19.3 5.4 39.8 8.4 60.7 8.4 127 0 230-89.2 230-199.1S357.2 0 230.1 0zm71.7 282.8h-74.9c-4 0-7.3-3.3-7.3-7.3v-10.7c0-4 3.3-7.3 7.3-7.3h42l-51.1-66.2v-1.6c0-.5-.1-1-.1-1.4 0-4 3.3-7.3 7.3-7.3h73c4 0 7.3 3.3 7.3 7.3v10.7c0 4-3.3 7.3-7.3 7.3h-40l49 63.4v1.6c0 .5.1 1 .1 1.4.1 4-3.2 7.4-7.2 7.4zm-132.8-51.7c-9.1 0-16.5-7.4-16.5-16.5 0-9.1 7.4-16.5 16.5-16.5 9.1 0 16.5 7.4 16.5 16.5 0 9.1-7.4 16.5-16.5 16.5zM126.9 283h-16.6c-5.7 0-10.4-4.7-10.4-10.4v-46.7c0-17 13.8-30.8 30.8-30.8h11.2c5.7 0 10.4 4.7 10.4 10.4v11.9c0 5.7-4.7 10.4-10.4 10.4h-5.2c-5.1 0-9.3 4.2-9.3 9.3v35.4c.1 5.8-4.6 10.5-10.5 10.5z"/>
    </svg>
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
            <div className="px-4 py-3.5 bg-pink-600">
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
              : "bg-pink-600 shadow-pink-600/30 hover:bg-pink-700"
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
