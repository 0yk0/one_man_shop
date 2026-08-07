import React from "react";
import { motion } from "framer-motion";
import { Download, Star, Smartphone, Monitor } from "lucide-react";
import { useDownloadUrl } from "../hooks/useDownloadUrl";
import { useGitHubStats } from "../hooks/useGitHubStats";

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export const Hero: React.FC = () => {
  const { url, label, alts } = useDownloadUrl();
  const { stars, downloads, loading } = useGitHubStats();

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
          className="text-lg sm:text-xl md:text-2xl text-gray-500 mb-6 max-w-2xl mx-auto leading-relaxed"
        >
          The only POS that costs nothing.
          <br />
          <span className="text-gray-400">UPI payments. Offline. Open source.</span>
        </motion.p>

        {/* Social proof badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 shadow-sm">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="font-semibold">{loading ? "..." : formatCount(stars)}</span> GitHub stars
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 shadow-sm">
            <Download size={14} className="text-blue-500" />
            <span className="font-semibold">{loading ? "..." : formatCount(downloads)}</span> downloads
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 shadow-sm">
            <Monitor size={14} className="text-green-500" />
            Desktop + Android
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
        >
          <a href={url} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-7 rounded-xl flex items-center justify-center gap-2 text-base sm:text-lg shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:-translate-y-0.5">
            <Smartphone size={20} /> {label}
          </a>
        </motion.div>
        <p className="text-sm text-gray-400 mb-4">
          Also available for{" "}
          {alts.map((alt, i) => (
            <span key={alt.label}>
              <a href={alt.url} className="underline hover:text-gray-600">{alt.label}</a>
              {i < alts.length - 1 && " and "}
            </span>
          ))}
        </p>
        <p className="text-sm text-gray-400 mb-16">
          No sign-up. No credit card. No internet required.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <img 
              src="/screenshots/screenshot-06.png" 
              alt="One Man Shop POS Screen" 
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
