import React from "react";
import { Github, Heart, Linkedin, Globe, Smartphone } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="py-12 px-4 bg-gray-900 text-gray-400">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/appicon.png" alt="" className="w-8 h-8 rounded-lg" />
              <span className="text-white font-semibold text-lg">One Man Shop</span>
            </div>
            <p className="text-sm leading-relaxed">Free, open-source POS for small shops in India. No subscriptions. No fees. No internet needed.</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Product</h4>
            <div className="flex flex-col gap-2">
              <a href="#features" className="hover:text-white transition-colors text-sm">Features</a>
              <a href="#screenshots" className="hover:text-white transition-colors text-sm">Screenshots</a>
              <a href="#faq" className="hover:text-white transition-colors text-sm">FAQ</a>
              <a href="https://github.com/0yk0/one_man_shop/releases/latest" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors text-sm flex items-center gap-1.5">
                <Smartphone size={14} /> Download for Android
              </a>
            </div>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-white font-semibold mb-3">Community</h4>
            <div className="flex flex-col gap-2">
              <a href="https://github.com/0yk0/one_man_shop" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors text-sm flex items-center gap-1.5">
                <Github size={14} /> GitHub
              </a>
              <a href="https://github.com/0yk0/one_man_shop/issues" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors text-sm">Report Issue</a>
              <a href="https://github.com/0yk0/one_man_shop/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors text-sm">Contributing</a>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 text-sm">
            Built with <Heart size={14} className="text-red-400 fill-red-400" /> by{" "}
            <a href="https://yk0.in" target="_blank" rel="noopener noreferrer" className="text-white no-underline font-medium hover:underline">Yatheesh</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/0yk0" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <Github size={18} />
            </a>
            <a href="https://linkedin.com/in/yatheeshkonduru" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <Linkedin size={18} />
            </a>
            <a href="https://yk0.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <Globe size={18} />
            </a>
          </div>
          <p className="text-gray-600 text-sm">&copy; 2026 One Man Shop &middot; MIT License</p>
        </div>
      </div>
    </footer>
  );
};
