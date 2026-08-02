import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const tabs = [
  { id: "pos", label: "POS Screen", image: "/screenshots/screenshot-06.png" },
  { id: "products", label: "Products", image: "/screenshots/screenshot-03.png" },
  { id: "reports", label: "Reports", image: "/screenshots/screenshot-10.png" },
  { id: "settings", label: "Settings", image: "/screenshots/screenshot-12.png" },
  { id: "display", label: "Customer Display", image: "/screenshots/screenshot-08.png" },
];

export const ScreenshotGallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-24 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-center mb-4"
        >See it in action</motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-lg text-gray-500 text-center max-w-2xl mx-auto mb-12"
        >A clean, intuitive interface designed for speed.</motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {tabs.map((tab, i) => (
              <button key={tab.id} onClick={() => setActiveTab(i)} className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${activeTab === i ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white"
              >
                <img src={tabs[activeTab].image} alt={tabs[activeTab].label} className="w-full h-auto block" />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
