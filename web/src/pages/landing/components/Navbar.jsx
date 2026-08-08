import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Map, ChevronDown } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Giới thiệu", href: "#features" },
    { label: "Cách hoạt động", href: "#how-it-works" },
    { label: "Ảnh app", href: "#screenshots" },
    { label: "Tải App", href: "#download" },
    { label: "Liên hệ", href: "#consult" },
  ];

  const scrollTo = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
              <Map size={16} className="text-white" />
            </div>
            <span
              className={`font-bold text-lg tracking-tight transition-colors ${
                scrolled ? "text-gray-900" : "text-white"
              }`}
            >
              AudioGo
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  scrolled
                    ? "text-gray-600 hover:text-pink-500 hover:bg-pink-50"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/login"
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                scrolled
                  ? "border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-500"
                  : "border-white/30 text-white/90 hover:border-white hover:bg-white/10"
              }`}
            >
              Đăng nhập
            </Link>
            <button
              onClick={() => scrollTo("#consult")}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-pink-600 text-white shadow-sm hover:shadow-md hover:bg-pink-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Đăng ký làm đối tác
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled ? "text-gray-700" : "text-white"
            }`}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed top-16 inset-x-0 z-40 bg-white shadow-xl border-b"
          >
            <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
              {links.map((l) => (
                <button
                  key={l.href}
                  onClick={() => scrollTo(l.href)}
                  className="text-left px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-pink-50 hover:text-pink-500 transition-colors"
                >
                  {l.label}
                </button>
              ))}
              <hr className="my-2" />
              <Link
                to="/login"
                className="px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Đăng nhập quản lý
              </Link>
              <button
                onClick={() => scrollTo("#consult")}
                className="px-4 py-3 rounded-lg font-semibold bg-pink-600 text-white text-center hover:bg-pink-700 transition-colors"
              >
                Đăng ký làm đối tác
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
