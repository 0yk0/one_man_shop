import React from "react";
import { motion } from "framer-motion";
import { Coffee, Store, Utensils, Briefcase } from "lucide-react";

const useCases = [
  {
    icon: Coffee,
    title: "Tea Stalls & Juice Corners",
    desc: "Accept UPI payments, track daily sales, and print receipts — all from your phone.",
    color: "amber",
  },
  {
    icon: Store,
    title: "Kirana Stores",
    desc: "Manage up to 50 products with prices and tax. Export sales data as CSV for your CA.",
    color: "green",
  },
  {
    icon: Utensils,
    title: "Cafes & Food Stalls",
    desc: "Show menu on customer display while taking orders. Generate UPI QR for each transaction.",
    color: "blue",
  },
  {
    icon: Briefcase,
    title: "Service Businesses",
    desc: "Use as a simple billing tool. Track daily/weekly revenue. Generate reports for GST filing.",
    color: "purple",
  },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  amber: { bg: "bg-amber-500/10", text: "text-amber-400" },
  green: { bg: "bg-green-500/10", text: "text-green-400" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-400" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400" },
};

export const UseCases: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-dark-primary">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-center mb-4 text-white"
        >
          Built for every type of shop
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-lg text-slate-400 text-center max-w-2xl mx-auto mb-12"
        >
          Whether you sell chai or clothes, One Man Shop works for you.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, i) => {
            const Icon = useCase.icon;
            const colors = colorMap[useCase.color];
            return (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-card glass-card-hover rounded-2xl p-6 transition-all duration-300"
              >
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={24} className={colors.text} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{useCase.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{useCase.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
