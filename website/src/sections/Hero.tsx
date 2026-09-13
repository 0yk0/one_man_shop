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
    <section className="flex flex-col items-center justify-center px-6 pt-32 pb-20 relative overflow-hidden bg-dark-primary">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 100 }}
          className="mb-8 inline-block relative"
        >
          {/* Glow behind icon */}
          <div className="absolute inset-0 bg-blue-500/30 rounded-3xl blur-2xl scale-150" />
          <img src="/appicon.png" alt="One Man Shop" className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl shadow-2xl" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-5xl sm:text-6xl md:text-8xl font-extrabold text-white mb-6 tracking-tight"
        >
          One Man Shop
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="text-xl sm:text-2xl md:text-3xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          The only POS that costs nothing.
          <br />
          <span className="text-slate-500">UPI payments. Offline. Open source.</span>
        </motion.p>

        {/* Social proof badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mb-10"
        >
          <span className="inline-flex items-center gap-1.5 glass-card rounded-full px-4 py-2 text-sm text-slate-300">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="font-semibold">{loading ? "..." : formatCount(stars)}</span> GitHub stars
          </span>
          <span className="inline-flex items-center gap-1.5 glass-card rounded-full px-4 py-2 text-sm text-slate-300">
            <Download size={14} className="text-blue-400" />
            <span className="font-semibold">{loading ? "..." : formatCount(downloads)}</span> downloads
          </span>
          <span className="inline-flex items-center gap-1.5 glass-card rounded-full px-4 py-2 text-sm text-slate-300">
            <Monitor size={14} className="text-green-400" />
            Desktop + Android
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
        >
          <a href={url} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-8 rounded-xl flex items-center justify-center gap-2 text-base sm:text-lg shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5">
            <Smartphone size={20} /> {label}
          </a>
        </motion.div>
        <p className="text-sm text-slate-500 mb-4">
          Also available for{" "}
          {alts.map((alt, i) => (
            <span key={alt.label}>
              <a href={alt.url} className="underline hover:text-slate-300 transition-colors">{alt.label}</a>
              {i < alts.length - 1 && " and "}
            </span>
          ))}
        </p>
        <p className="text-sm text-slate-500 mb-16">
          No sign-up. No credit card. No internet required.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden glow-blue">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent z-10" />
            <img 
              src="/screenshots/screenshot-06.png" 
              alt="One Man Shop POS Screen" 
              className="w-full h-auto block relative z-0"
              loading="lazy"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
