import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

function DynIcon({ name, ...props }) {
  const Icon = LucideIcons[name] || LucideIcons.Sparkles;
  return <Icon {...props} />;
}

export default function StatsBarSection({ data }) {
  const items = data?.items || [];

  return (
    <section className="bg-gradient-to-r from-orange-500 to-pink-500 py-4">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-2 text-white text-sm font-medium"
            >
              <DynIcon name={item.icon} size={15} className="text-white/80" />
              <span>{item.text}</span>
              {i < items.length - 1 && (
                <span className="hidden sm:inline text-white/30 ml-6">|</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
