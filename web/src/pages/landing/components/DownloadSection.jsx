import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, QrCode, Info, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getLatestRelease } from "@/api/landingApi";

export default function DownloadSection({ data }) {
  const {
    title = "Sẵn sàng khám phá?",
    subtitle = "Tải app ngay — miễn phí, không cần tài khoản.",
    installGuide = "Cần bật 'Cài đặt từ nguồn không xác định' trong Cài đặt > Bảo mật trên Android.",
    googlePlayText = "Sắp ra mắt trên Google Play",
    appLogoUrl = "",
    appName = "AudioGo Android",
  } = data || {};

  const [release, setRelease] = useState(null);
  const [loadingRelease, setLoadingRelease] = useState(true);

  useEffect(() => {
    getLatestRelease()
      .then(setRelease)
      .finally(() => setLoadingRelease(false));
  }, []);

  const apkUrl = release?.apkUrl || null;

  return (
    <section id="download" className="py-24 bg-gradient-to-br from-gray-900 via-[#1a0a14] to-gray-900">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-600/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{title}</h2>
          <p className="text-white/60 text-lg">{subtitle}</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* Download card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-5 min-w-[280px]"
          >
            {appLogoUrl ? (
              <img
                src={appLogoUrl}
                alt="AudioGo"
                className="w-16 h-16 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-pink-600 flex items-center justify-center shadow-lg">
                <Smartphone size={32} className="text-white" />
              </div>
            )}

            <div className="text-center">
              <h3 className="text-white font-bold text-xl">{appName}</h3>
              {loadingRelease ? (
                <p className="text-white/40 text-sm mt-1 flex items-center justify-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Đang tải...
                </p>
              ) : release ? (
                <p className="text-white/50 text-sm mt-1">
                  v{release.version} · {release.fileSizeMb} MB · Android {release.minAndroidVersion}+
                </p>
              ) : (
                <p className="text-white/40 text-sm mt-1">Chưa có phiên bản</p>
              )}
            </div>

            {/* APK download */}
            {apkUrl ? (
              <a
                href={apkUrl}
                download
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white bg-pink-600 hover:bg-pink-700 hover:shadow-lg hover:shadow-pink-600/30 hover:scale-[1.02] active:scale-[0.97] transition-all"
              >
                <Download size={18} />
                Tải APK Android
              </a>
            ) : (
              <div className="w-full py-3.5 rounded-xl font-medium text-center text-white/40 border border-white/10">
                {loadingRelease ? "Đang tải..." : "Chưa có APK"}
              </div>
            )}

            {/* Google Play placeholder */}
            <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-white/30 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/40">
                <path d="M3.18 23.76c.3.17.64.23.97.17l.08-.04L14.01 12 4.23.11l-.08-.04a1.5 1.5 0 0 0-.97.17C2.87.65 2.5 1.3 2.5 2v20c0 .7.37 1.35.68 1.76z"/>
                <path d="m16.59 10.17-2.12-2.12L5.34.05A1.68 1.68 0 0 1 7 .37l11.87 6.87-2.28 2.93z"/>
                <path d="M18.87 16.76 7 23.63a1.68 1.68 0 0 1-1.66.32l9.13-8.1 2.12 2.12 2.28 2.79z"/>
                <path d="M19.82 15 21.5 14a1.5 1.5 0 0 0 0-2.62L19.82 10.5l-2.38 2.38 2.38 2.12z"/>
              </svg>
              {googlePlayText}
            </div>

            {/* Install guide */}
            <div className="flex gap-2 text-xs text-white/40 text-left">
              <Info size={13} className="flex-shrink-0 mt-0.5" />
              <span>{installGuide}</span>
            </div>
          </motion.div>

          {/* QR Code */}
          {apkUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="bg-white p-4 rounded-2xl shadow-xl">
                <QRCodeSVG
                  value={apkUrl}
                  size={180}
                  level="H"
                  includeMargin={false}
                  fgColor="#111827"
                />
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <QrCode size={14} />
                Quét để tải app
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
