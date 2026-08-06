import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";

const iconMap = {
  MapPin: LucideIcons.MapPin,
  Globe: LucideIcons.Globe,
  Heart: LucideIcons.Heart,
  Star: LucideIcons.Star,
  Users: LucideIcons.Users,
  Music: LucideIcons.Music,
};

function DynIcon({ name, ...props }) {
  const Icon = iconMap[name] || LucideIcons.Star;
  return <Icon {...props} />;
}

export default function HeroSection({ data }) {
  const {
    badge = "🎧 Thuyết minh du lịch bằng âm thanh",
    heading1 = "Khám Phá Phố Ẩm Thực",
    heading2 = "Qua Từng Câu Chuyện",
    description = "Ứng dụng thuyết minh tự động theo vị trí cho Phố Ẩm Thực Vĩnh Khánh Q4.",
    cta1Text = "Tải App Android",
    cta1Link = "#download",
    cta2Text = "Xem cách hoạt động",
    cta2Link = "#how-it-works",
    backgroundImageUrl = "",
    stats = [],
  } = data || {};

  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background */}
      {backgroundImageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#1a0a14] to-[#0d0d1a]" />
      )}

      {/* Decorative orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-pink-600/20 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-orange-500/15 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-purple-900/10 blur-[120px]" />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-6"
        >
          {badge}
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"
        >
          <span className="text-white">{heading1}</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400">
            {heading2}
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed"
        >
          {description}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => scrollTo(cta1Link)}
            className="group flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.03] active:scale-[0.97] transition-all"
          >
            <LucideIcons.Download size={18} />
            {cta1Text}
          </button>
          <button
            onClick={() => scrollTo(cta2Link)}
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-base border border-white/30 text-white/90 hover:bg-white/10 hover:border-white/50 transition-all"
          >
            {cta2Text}
          </button>
        </motion.div>

        {/* Stats pills */}
        {stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-3"
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15"
              >
                <DynIcon name={stat.icon} size={15} className="text-orange-400" />
                <span className="text-white font-bold text-sm">{stat.value}</span>
                <span className="text-white/60 text-sm">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="text-white/40"
          >
            <ChevronDown size={28} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
