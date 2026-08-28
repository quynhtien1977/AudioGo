import { motion } from "framer-motion";
import DynamicIcon from "@/components/DynamicIcon";
import { Zap } from "lucide-react";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45 },
  }),
};

export default function FeaturesSection({ data }) {
  const {
    title = "Tính năng nổi bật",
    subtitle = "Trải nghiệm ẩm thực theo cách chưa từng có",
    items = [],
  } = data || {};

  return (
    <section
      id="features"
      className="py-24"
      style={{ background: "var(--lp-bg)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span
            style={{
              background: "var(--lp-badge-bg)",
              color: "var(--lp-badge-text)",
              border: "1px solid var(--lp-badge-border)",
            }}
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
          >
            {data?.badge || "Tính năng"}
          </span>
          <h2
            style={{ color: "var(--lp-text)" }}
            className="text-3xl sm:text-4xl font-bold mb-4"
          >
            {title}
          </h2>
          <p style={{ color: "var(--lp-text-muted)" }} className="text-lg max-w-xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              style={{
                background: "var(--lp-bg-card)",
                borderColor: "var(--lp-border)",
              }}
              className="group p-6 rounded-2xl border hover:border-pink-400/50 hover:shadow-lg transition-all duration-300 cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/10 flex items-center justify-center mb-4 group-hover:from-pink-500/30 group-hover:to-orange-500/20 transition-colors">
                <DynamicIcon name={item.icon} fallback={Zap} size={22} className="text-pink-500" />
              </div>
              <h3
                style={{ color: "var(--lp-text)" }}
                className="font-semibold mb-2 text-base"
              >
                {item.title}
              </h3>
              <p style={{ color: "var(--lp-text-muted)" }} className="text-sm leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
