import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { useDownloadUrl } from "../hooks/useDownloadUrl";

export const FloatingCTA: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { url } = useDownloadUrl();

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px
      if (window.scrollY > 500 && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="relative">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors z-10"
            >
              <X size={12} />
            </button>

            {/* CTA Button */}
            <a
              href={url}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-full shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Download Free</span>
              <span className="sm:hidden">Download</span>
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
