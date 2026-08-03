import React from "react";
import { motion } from "framer-motion";
import { Apple } from "lucide-react";
import { useDownloadUrl } from "../hooks/useDownloadUrl";

export const DownloadCTA: React.FC = () => {
  const { url, label, otherUrl, otherLabel } = useDownloadUrl();
  return (
    <section id="download" className="py-24 px-4 bg-gradient-to-b from-white to-blue-50/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">Ready to simplify your shop?</h2>
        <p className="text-lg sm:text-xl text-gray-500 mb-10">Free download. No sign-up. No internet required.</p>

        <a href={url} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-2xl inline-flex items-center justify-center gap-3 text-lg shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:-translate-y-0.5 mb-4">
          <Apple size={24} /> {label}
        </a>
        <p className="text-sm text-gray-400 mb-8">
          Also available for{" "}
          <a href={otherUrl} className="underline hover:text-gray-600">
            {otherLabel}
          </a>
        </p>
        <p className="text-sm text-gray-400">Works on macOS 12+ and Windows 10+ · Open source · MIT License</p>
      </motion.div>
    </section>
  );
};
