import React from "react";
import { motion } from "framer-motion";
import { Download, Github } from "lucide-react";

export const Hero: React.FC = () => {
  return (
    <section className="flex flex-col items-center justify-center px-6 pt-28 pb-16 relative overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 100 }}
          className="mb-8 inline-block"
        >
          <img src="/appicon.png" alt="One Man Shop" className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl shadow-2xl" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-gray-900 mb-4 tracking-tight"
        >
          One Man Shop
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="text-lg sm:text-xl md:text-2xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Your shop deserves a simple POS.
          <br />
          <span className="text-gray-400">No subscriptions. No internet needed. Scan to pay.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <a href="https://github.com/0yk0/one_man_shop/releases/latest" target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-7 rounded-xl flex items-center justify-center gap-2 text-base sm:text-lg shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:-translate-y-0.5">
            <Download size={20} /> Download for macOS
          </a>
          <a href="https://github.com/0yk0/one_man_shop/releases/latest" target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-7 rounded-xl flex items-center justify-center gap-2 text-base sm:text-lg shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:-translate-y-0.5">
            <Download size={20} /> Download for Windows
          </a>
          <a href="https://github.com/0yk0/one_man_shop" target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 px-7 rounded-xl border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center gap-2 text-base sm:text-lg transition-all">
            <Github size={20} /> View on GitHub
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <img src="/screenshots/screenshot-06.png" alt="One Man Shop POS Screen" className="w-full h-auto block" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
