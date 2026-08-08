import { motion } from "framer-motion";

export default function HowItWorksSection({ data }) {
  const { title = "Cách hoạt động", steps = [] } = data || {};

  return (
    <section id="how-it-works" className="py-24 bg-[#fdf7f9]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-600 border border-pink-100 mb-4">
            Hướng dẫn
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute left-1/2 -translate-x-px top-8 bottom-8 w-0.5 bg-gradient-to-b from-pink-200 via-orange-200 to-transparent" />

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
                  <h3 className="font-semibold text-gray-900 text-base mb-1">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
