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
  amber: { bg: "bg-amber-100", text: "text-amber-600" },
  green: { bg: "bg-green-100", text: "text-green-600" },
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
};

export const UseCases: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-center mb-4"
        >
          Built for every type of shop
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-lg text-gray-500 text-center max-w-2xl mx-auto mb-12"
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
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={24} className={colors.text} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{useCase.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{useCase.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
