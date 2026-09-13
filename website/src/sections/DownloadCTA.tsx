import React from "react";
import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";
import { useDownloadUrl } from "../hooks/useDownloadUrl";

export const DownloadCTA: React.FC = () => {
  const { url, label, alts } = useDownloadUrl();
  return (
    <section id="download" className="py-24 px-4 bg-dark-primary relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center relative z-10"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">Ready to simplify your shop?</h2>
        <p className="text-lg sm:text-xl text-slate-400 mb-10">Free download. No sign-up. No internet required.</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <a href={url} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-8 rounded-2xl inline-flex items-center justify-center gap-3 text-lg shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5">
            <Smartphone size={24} /> {label}
          </a>
        </div>
        
        <p className="text-sm text-slate-500 mb-2">
          Also available for{" "}
          {alts.map((alt, i) => (
            <span key={alt.label}>
              <a href={alt.url} className="underline hover:text-slate-300 transition-colors">{alt.label}</a>
              {i < alts.length - 1 && " and "}
            </span>
          ))}
        </p>
        <p className="text-sm text-slate-500">Works on macOS 12+, Windows 10+, and Android 5.0+ · Open source · MIT License</p>
      </motion.div>
    </section>
  );
};
