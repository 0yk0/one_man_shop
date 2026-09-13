import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X, Github, Download, Star } from "lucide-react";
import { useGitHubStats } from "../hooks/useGitHubStats";

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { stars, downloads, loading } = useGitHubStats();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0b1120]/95 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/appicon.png" alt="" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-white text-lg">One Man Shop</span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-slate-300 hover:text-white transition-colors">Features</a>
          <a href="#screenshots" className="text-sm text-slate-300 hover:text-white transition-colors">Screenshots</a>
          <a href="#faq" className="text-sm text-slate-300 hover:text-white transition-colors">FAQ</a>
          <a
            href="https://github.com/0yk0/one_man_shop"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <Github size={16} />
            <span className="flex items-center gap-0.5">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {loading ? "..." : formatCount(stars)}
            </span>
          </a>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Download size={12} />
            {loading ? "..." : formatCount(downloads)}
          </span>
          <a href="#download" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-blue-600/25">Download</a>
        </div>

        {/* Hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 -mr-2">
          {open ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0b1120]/98 backdrop-blur-xl border-b border-white/5 px-4 pb-4 flex flex-col gap-2">
          <a href="#features" onClick={() => setOpen(false)} className="text-slate-300 hover:text-white py-3 px-3 rounded-lg hover:bg-white/5 transition-colors">Features</a>
          <a href="#screenshots" onClick={() => setOpen(false)} className="text-slate-300 hover:text-white py-3 px-3 rounded-lg hover:bg-white/5 transition-colors">Screenshots</a>
          <a href="#faq" onClick={() => setOpen(false)} className="text-slate-300 hover:text-white py-3 px-3 rounded-lg hover:bg-white/5 transition-colors">FAQ</a>
          <a
            href="https://github.com/0yk0/one_man_shop"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-300 hover:text-white py-3 px-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Github size={16} />
            GitHub
            <span className="flex items-center gap-0.5 text-xs text-slate-500 ml-auto">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {loading ? "..." : formatCount(stars)}
            </span>
          </a>
          <a href="#download" onClick={() => setOpen(false)} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-3 rounded-lg text-center transition-colors shadow-lg shadow-blue-600/25">Download</a>
        </div>
      )}
    </motion.nav>
  );
};
