import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Map, Sun, Moon, ChevronDown, Globe2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { SUPPORTED_LANGS } from "@/api/landingApi";

export default function Navbar({ lang = "vi", onLangChange, staticData = {} }) {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen]     = useState(false);
  const langRef                     = useRef(null);
  const { theme, toggle }           = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const links = [
    { label: staticData.navIntro || "Giới thiệu",    href: "#features" },
    { label: staticData.navHow || "Cách hoạt động", href: "#how-it-works" },
    { label: staticData.navScreenshots || "Ảnh app",       href: "#screenshots" },
    { label: staticData.navDownload || "Tải App",       href: "#download" },
    { label: staticData.navContact || "Liên hệ",       href: "#consult" },
  ];

  const scrollTo = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const isLight = theme === "light";
  const currentLang = SUPPORTED_LANGS.find((l) => l.code === lang) || SUPPORTED_LANGS[0];

  const handleLangSelect = (code) => {
    onLangChange?.(code);
    setLangOpen(false);
  };

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
          <nav className="hidden xl:flex items-center gap-1">
            {links.map((l) => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                style={{ color: scrolled ? "var(--lp-text-muted)" : "rgba(255,255,255,0.8)" }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:text-pink-400 whitespace-nowrap"
              >
                {l.label}
              </button>
            ))}
          </nav>

          {/* CTAs + Theme toggle + Lang switcher */}
          <div className="hidden xl:flex items-center gap-2">
            {/* Language switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((v) => !v)}
                style={{
                  background: scrolled ? "var(--lp-bg-card)" : "rgba(255,255,255,0.1)",
                  border: `1px solid ${scrolled ? "var(--lp-border)" : "rgba(255,255,255,0.2)"}`,
                  color: scrolled ? "var(--lp-text-muted)" : "rgba(255,255,255,0.9)",
                }}
                className="h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-all hover:text-pink-400"
                aria-label="Chọn ngôn ngữ"
              >
                <span className="text-lg">{currentLang.flag}</span>
                <span className="uppercase">{currentLang.code}</span>
                <ChevronDown size={12} className={`transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-11 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-44 overflow-hidden"
                  >
                    {SUPPORTED_LANGS.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => handleLangSelect(l.code)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                          l.code === lang
                            ? "bg-pink-50 text-pink-600 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-base">{l.flag}</span>
                        <span>{l.label}</span>
                        {l.code === lang && (
                          <span className="ml-auto text-[10px] font-bold text-pink-400 bg-pink-50 px-1.5 py-0.5 rounded">✓</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:border-pink-400 hover:text-pink-400 whitespace-nowrap"
            >
              {staticData.navLogin || "Đăng nhập"}
            </Link>
            <button
              onClick={() => scrollTo("#consult")}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-pink-600 text-white shadow-sm hover:shadow-md hover:bg-pink-700 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              {staticData.navPartner || "Đăng ký làm đối tác"}
            </button>
          </div>

          {/* Mobile controls */}
          <div className="xl:hidden flex items-center gap-2">
            <button
              onClick={() => setLangOpen((v) => !v)}
              style={{ color: scrolled ? "var(--lp-text)" : "white" }}
              className="px-3 py-1.5 rounded-lg transition-colors text-sm font-bold flex items-center gap-2"
            >
              <span className="text-lg">{currentLang.flag}</span>
              <span className="uppercase">{currentLang.code}</span>
            </button>
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

      {/* Mobile lang dropdown */}
      <AnimatePresence>
        {langOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="xl:hidden fixed top-16 right-4 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-44"
          >
            {SUPPORTED_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => handleLangSelect(l.code)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  l.code === lang
                    ? "bg-pink-50 text-pink-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-base">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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
                {staticData.navLoginMobile || "Đăng nhập quản lý"}
              </Link>
              <button
                onClick={() => scrollTo("#consult")}
                className="px-4 py-3 rounded-lg font-semibold bg-pink-600 text-white text-center hover:bg-pink-700 transition-colors"
              >
                {staticData.navPartner || "Đăng ký làm đối tác"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
