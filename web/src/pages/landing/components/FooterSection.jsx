import { Link } from "react-router-dom";
import { MapPin, Mail, Phone } from "lucide-react";

/* ── SVG icons cho từng platform ── */
const SOCIAL_ICONS = {
  facebook: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.79a8.18 8.18 0 004.78 1.52V6.85a4.85 4.85 0 01-1.01-.16z"/>
    </svg>
  ),
  zalo: (
    <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor">
      <path d="M16 2C8.268 2 2 7.948 2 15.208c0 4.31 2.14 8.137 5.47 10.608L5.66 30l5.08-2.27A14.4 14.4 0 0016 28.416c7.732 0 14-5.948 14-13.208C30 7.948 23.732 2 16 2z"/>
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
};

const PLATFORM_COLORS = {
  facebook:  "bg-[#1877F2]",
  instagram: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
  youtube:   "bg-red-600",
  tiktok:    "bg-gray-900",
  zalo:      "bg-[#0068FF]",
  twitter:   "bg-black",
};

function SocialIcon({ platform }) {
  const icon = SOCIAL_ICONS[platform?.toLowerCase()] || (
    <span className="text-white text-[10px] font-bold uppercase">{platform?.[0]}</span>
  );
  const bg = PLATFORM_COLORS[platform?.toLowerCase()] || "bg-white/20";
  return (
    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 ${bg}`}>
      {icon}
    </span>
  );
}

export default function FooterSection({ data }) {
  const {
    description  = "AudioGo — Ứng dụng thuyết minh ẩm thực bằng âm thanh.",
    address      = "Phố Ẩm Thực Vĩnh Khánh, Quận 4, TP. Hồ Chí Minh",
    email        = "hello@audiogo.vn",
    phone        = "",
    zaloLink     = "",
    logoUrl      = "",
    socialLinks  = [],
  } = data || {};

  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt="AudioGo" className="h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                  <MapIcon size={16} className="text-white" />
                </div>
              )}
              <span className="font-bold text-lg tracking-tight">AudioGo</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-5">{description}</p>

            {/* Social links — icon tròn màu */}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    title={s.platform}
                    className="hover:opacity-80 hover:scale-110 transition-all"
                  >
                    <SocialIcon platform={s.platform} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm text-white/80 uppercase tracking-wider mb-5">Liên hệ</h4>
            <div className="space-y-3 text-sm text-white/50">
              {address && (
                <div className="flex gap-2.5">
                  <MapPin size={14} className="flex-shrink-0 mt-0.5 text-pink-400" />
                  <span>{address}</span>
                </div>
              )}
              {email && (
                <div className="flex gap-2.5 items-center">
                  <Mail size={14} className="text-pink-400 flex-shrink-0" />
                  <a href={`mailto:${email}`} className="hover:text-white transition-colors truncate">{email}</a>
                </div>
              )}
              {phone && (
                <div className="flex gap-2.5 items-center">
                  <Phone size={14} className="text-pink-400 flex-shrink-0" />
                  <a href={`tel:${phone.replace(/\s/g,"")}`} className="hover:text-white transition-colors">{phone}</a>
                </div>
              )}
              {zaloLink && (
                <a
                  href={zaloLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0068FF]/20 text-[#4fa3ff] hover:bg-[#0068FF]/30 transition-colors text-xs font-medium"
                >
                  Chat Zalo →
                </a>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-sm text-white/80 uppercase tracking-wider mb-5">Nhanh</h4>
            <div className="space-y-3 text-sm text-white/50">
              {[
                { label: "Tính năng",        href: "#features" },
                { label: "Cách hoạt động",   href: "#how-it-works" },
                { label: "Tải App",          href: "#download" },
                { label: "Đăng ký đối tác", href: "#consult" },
              ].map((l) => (
                <div key={l.href}>
                  <a
                    href={l.href}
                    onClick={(e) => {
                      e.preventDefault();
                      document.querySelector(l.href)?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {l.label}
                  </a>
                </div>
              ))}
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-pink-400 hover:text-pink-300 transition-colors font-medium"
                >
                  Đăng nhập quản lý →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <span>© {new Date().getFullYear()} AudioGo. All rights reserved.</span>
          <span>Made with ❤️ in Hồ Chí Minh</span>
        </div>
      </div>
    </footer>
  );
}
