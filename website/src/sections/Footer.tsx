import React from "react";
import { Github, Heart, Linkedin, Globe } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="py-12 px-4 bg-gray-900 text-gray-400">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img src="/appicon.png" alt="" className="w-8 h-8 rounded-lg" />
              <span className="text-white font-semibold text-lg">One Man Shop</span>
            </div>
            <p className="text-sm">Built for a friend&apos;s small shop. Made open source for everyone.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="https://github.com/0yk0/one_man_shop" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Github size={18} /> GitHub
            </a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="https://github.com/0yk0/one_man_shop/issues" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Report Issue</a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-sm">
          <div className="flex items-center justify-center gap-1 mb-3">
            Built with <Heart size={14} className="text-red-400 fill-red-400" /> by{" "}
            <a href="https://yk0.in" target="_blank" rel="noopener noreferrer" className="text-white no-underline font-medium hover:underline">Yatheesh</a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 mb-3">
            <a href="https://github.com/0yk0" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Github size={16} /> GitHub
            </a>
            <a href="https://linkedin.com/in/yatheeshkonduru" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Linkedin size={16} /> LinkedIn
            </a>
            <a href="https://yk0.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Globe size={16} /> Website
            </a>
          </div>
          <p className="text-gray-600">&copy; 2026 One Man Shop &middot; MIT License</p>
        </div>
      </div>
    </footer>
  );
};
