import { motion } from "framer-motion";
import DynamicIcon from "@/components/DynamicIcon";
import { Sparkles } from "lucide-react";

export default function StatsBarSection({ data }) {
  const items = data?.items || [];
  if (!items.length) return null;

  const shouldMarquee = items.length > 4;

  const ContentBlock = ({ hideLastDivider }) => (
    <div className={`flex items-center gap-x-8 ${shouldMarquee ? "w-max shrink-0 px-4" : "flex-wrap justify-center w-full"}`}>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap">
          <DynamicIcon name={item.icon} fallback={Sparkles} size={15} className="text-white/80" />
          <span>{item.text}</span>
          {(!hideLastDivider || i < items.length - 1) && (
            <span className={`${shouldMarquee ? "inline" : "hidden sm:inline"} text-white/30 ml-6`}>|</span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <section className="bg-gradient-to-r from-orange-500 to-pink-500 py-4 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        {shouldMarquee ? (
          <div className="flex w-full">
            <motion.div
              className="flex w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
            >
              <ContentBlock hideLastDivider={false} />
              <ContentBlock hideLastDivider={false} />
            </motion.div>
          </div>
        ) : (
          <ContentBlock hideLastDivider={true} />
        )}
      </div>
    </section>
  );
}
