import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone, Monitor } from "lucide-react";
import { useDownloadUrl } from "../hooks/useDownloadUrl";

export const ExitIntent: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const { url, otherUrl, otherLabel } = useDownloadUrl();

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      // Only trigger when mouse leaves from top
      if (e.clientY <= 0 && !hasShown) {
        setShowPopup(true);
        setHasShown(true);
      }
    },
    [hasShown]
  );

  useEffect(() => {
    // Don't show on mobile
    if ("ontouchstart" in window) return;

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [handleMouseLeave]);

  // Also show after 30 seconds on page
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasShown) {
        setShowPopup(true);
        setHasShown(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [hasShown]);

  const handleClose = () => {
    setShowPopup(false);
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors z-10"
            >
              <X size={16} />
            </button>

            {/* Content */}
            <div className="p-8 text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Download size={28} className="text-blue-600" />
              </div>

              {/* Text */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Wait! Before you go
              </h3>
              <p className="text-gray-500 mb-6">
                Download One Man Shop for free. No sign-up required.
              </p>

              {/* Download buttons */}
              <div className="flex flex-col gap-3">
                <a
                  href={url}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  <Monitor size={18} />
                  Download for Desktop
                </a>
                <a
                  href="https://github.com/0yk0/one_man_shop/releases/latest"
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  <Smartphone size={18} />
                  Download for Android
                </a>
              </div>

              {/* Secondary link */}
              <p className="text-sm text-gray-400 mt-4">
                Also available for{" "}
                <a href={otherUrl} className="underline hover:text-gray-600">
                  {otherLabel}
                </a>
              </p>
            </div>

            {/* Trust badges */}
            <div className="bg-gray-50 px-8 py-4 flex items-center justify-center gap-6 text-sm text-gray-500">
              <span>✓ Free forever</span>
              <span>✓ No sign-up</span>
              <span>✓ Works offline</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
