import React from "react";
import { motion } from "framer-motion";
import { Wifi, Monitor, CreditCard, BarChart3, Check } from "lucide-react";

const points = [
  { icon: Wifi, problem: "\"My POS needs internet and crashes during rush hour\"", solution: "Works completely offline. No WiFi? No problem." },
  { icon: Monitor, problem: "\"I can't see what my customer sees on their end\"", solution: "Customer Display shows your menu, bill, and QR on a second screen." },
  { icon: CreditCard, problem: "\"I pay monthly fees for a POS I barely use\"", solution: "100% free. No hidden charges, no monthly bills. Ever." },
  { icon: BarChart3, problem: "\"I have no idea how much I sold today\"", solution: "Built-in daily and weekly reports with charts. Export as CSV." },
];

export const PainPoints: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-center mb-4"
        >Built for real shop problems</motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-lg text-gray-500 text-center max-w-2xl mx-auto mb-12"
        >We know what small shop owners deal with every day.</motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {points.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center">
                    <Icon size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-400 text-sm mb-1 line-through decoration-red-300">{p.problem}</p>
                    <p className="text-gray-900 font-medium flex items-center gap-2">
                      <Check size={16} className="text-green-500 shrink-0" />
                      {p.solution}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
