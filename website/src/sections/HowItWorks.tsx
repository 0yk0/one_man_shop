import React from "react";
import { motion } from "framer-motion";
import { Download, Package, QrCode } from "lucide-react";

const steps = [
  { icon: Download, number: "1", title: "Download & install", desc: "Free download for macOS or Windows. Takes less than a minute." },
  { icon: Package, number: "2", title: "Add your products", desc: "Set up your product list with names, prices, and images." },
  { icon: QrCode, number: "3", title: "Start selling", desc: "Tap products, generate UPI QR, and complete sales instantly." },
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-center mb-4"
        >Start selling in 3 steps</motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-lg text-gray-500 text-center max-w-2xl mx-auto mb-12"
        >Takes less than 2 minutes. Seriously.</motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: "spring", damping: 12, stiffness: 100 }}
                className="text-center"
              >
                <div className="relative inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 mb-6">
                  <Icon size={28} className="text-white" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 max-w-[256px] mx-auto">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
