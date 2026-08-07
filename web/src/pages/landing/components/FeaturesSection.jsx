import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

function DynIcon({ name, ...props }) {
  const Icon = LucideIcons[name] || LucideIcons.Zap;
  return <Icon {...props} />;
}

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
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-600 border border-pink-100 mb-4">
            Tính năng
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">{subtitle}</p>
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
              className="group p-6 rounded-2xl border border-gray-100 hover:border-pink-200 hover:shadow-lg hover:shadow-pink-50 transition-all duration-300 cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center mb-4 group-hover:from-pink-100 group-hover:to-orange-100 transition-colors">
                <DynIcon name={item.icon} size={22} className="text-pink-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-base">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
