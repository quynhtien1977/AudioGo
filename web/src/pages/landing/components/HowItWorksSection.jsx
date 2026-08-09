import { motion } from "framer-motion";

export default function HowItWorksSection({ data }) {
  const { title = "Cách hoạt động", steps = [] } = data || {};

  return (
    <section
      id="how-it-works"
      className="py-24"
      style={{ background: "var(--lp-section-light)" }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
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
            {data.badge || "Hướng dẫn"}
          </span>
          <h2
            style={{ color: "var(--lp-text)" }}
            className="text-3xl sm:text-4xl font-bold"
          >
            {title}
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute left-1/2 -translate-x-px top-8 bottom-8 w-0.5 bg-gradient-to-b from-pink-500/40 via-orange-400/30 to-transparent" />

          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-16 md:gap-y-12">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center sm:items-start text-center sm:text-left"
              >
                {/* Number bubble */}
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-pink-600/30">
                  {i + 1}
                </div>
                <div className="pt-1.5">
                  <h3
                    style={{ color: "var(--lp-text)" }}
                    className="font-semibold text-base mb-1"
                  >
                    {step.title}
                  </h3>
                  <p style={{ color: "var(--lp-text-muted)" }} className="text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
