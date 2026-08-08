import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Map, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();

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

  const isLight = theme === "light";

  return (
    <>
      <header
        style={scrolled ? { background: "var(--lp-nav-bg)", backdropFilter: "blur(12px)" } : { background: "transparent" }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "shadow-sm" : ""}`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
              <Map size={16} className="text-white" />
            </div>
            <span
              style={{ color: scrolled ? "var(--lp-text)" : "white" }}
              className="font-bold text-lg tracking-tight transition-colors"
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
                style={{ color: scrolled ? "var(--lp-text-muted)" : "rgba(255,255,255,0.8)" }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:text-pink-400"
              >
                {l.label}
              </button>
            ))}
          </nav>

          {/* CTAs + Theme toggle */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              aria-label="Chuyển đổi giao diện"
              style={{
                background: scrolled ? "var(--lp-bg-card)" : "rgba(255,255,255,0.1)",
                border: `1px solid ${scrolled ? "var(--lp-border)" : "rgba(255,255,255,0.2)"}`,
                color: scrolled ? "var(--lp-text-muted)" : "rgba(255,255,255,0.8)",
              }}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105 hover:text-pink-400"
            >
              {isLight ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <Link
              to="/login"
              style={{
                border: `1px solid ${scrolled ? "var(--lp-border)" : "rgba(255,255,255,0.3)"}`,
                color: scrolled ? "var(--lp-text-muted)" : "rgba(255,255,255,0.9)",
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:border-pink-400 hover:text-pink-400"
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

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            {/* Theme toggle mobile */}
            <button
              onClick={toggle}
              style={{ color: scrolled ? "var(--lp-text)" : "white" }}
              className="p-2 rounded-lg transition-colors"
              aria-label="Chuyển đổi giao diện"
            >
              {isLight ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              style={{ color: scrolled ? "var(--lp-text)" : "white" }}
              className="p-2 rounded-lg transition-colors"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
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
            style={{ background: "var(--lp-mobile-menu)", borderColor: "var(--lp-border)" }}
            className="fixed top-16 inset-x-0 z-40 shadow-xl border-b"
          >
            <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
              {links.map((l) => (
                <button
                  key={l.href}
                  onClick={() => scrollTo(l.href)}
                  style={{ color: "var(--lp-text-muted)" }}
                  className="text-left px-4 py-3 rounded-lg font-medium hover:bg-pink-50/10 hover:text-pink-400 transition-colors"
                >
                  {l.label}
                </button>
              ))}
              <hr style={{ borderColor: "var(--lp-border)" }} className="my-2" />
              <Link
                to="/login"
                style={{ color: "var(--lp-text-muted)" }}
                className="px-4 py-3 rounded-lg font-medium hover:text-pink-400 transition-colors"
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
