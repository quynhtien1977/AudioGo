import { Link } from "react-router-dom";
import { Map, Mail, MapPin, Phone, ExternalLink } from "lucide-react";

export default function FooterSection({ data }) {
  const {
    description = "AudioGo — Ứng dụng thuyết minh ẩm thực bằng âm thanh.",
    address = "Phố Ẩm Thực Vĩnh Khánh, Quận 4, TP. Hồ Chí Minh",
    email = "hello@audiogo.vn",
    phone = "",
    zaloLink = "",
    socialLinks = [],
  } = data || {};

  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-400 rounded-lg flex items-center justify-center">
                <Map size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">AudioGo</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-5">{description}</p>
            {/* Social links */}
            <div className="flex gap-3">
              {socialLinks.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <ExternalLink size={13} />
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm text-white/80 uppercase tracking-wider mb-5">
              Liên hệ
            </h4>
            <div className="space-y-3 text-sm text-white/50">
              {address && (
                <div className="flex gap-2.5">
                  <MapPin size={14} className="flex-shrink-0 mt-0.5 text-pink-400" />
                  <span>{address}</span>
                </div>
              )}
              {email && (
                <div className="flex gap-2.5 items-center">
                  <Mail size={14} className="text-pink-400" />
                  <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                    {email}
                  </a>
                </div>
              )}
              {phone && (
                <div className="flex gap-2.5 items-center">
                  <Phone size={14} className="text-pink-400" />
                  <a href={`tel:${phone}`} className="hover:text-white transition-colors">
                    {phone}
                  </a>
                </div>
              )}
              {zaloLink && (
                <a
                  href={zaloLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors text-xs font-medium"
                >
                  Chat Zalo →
                </a>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-sm text-white/80 uppercase tracking-wider mb-5">
              Nhanh
            </h4>
            <div className="space-y-3 text-sm text-white/50">
              {[
                { label: "Tính năng", href: "#features" },
                { label: "Cách hoạt động", href: "#how-it-works" },
                { label: "Tải App", href: "#download" },
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
