import React from "react";
import { motion } from "framer-motion";
import { Download, Github } from "lucide-react";

export const Hero: React.FC = () => {
  return (
    <section style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "120px 24px 64px", position: "relative", overflow: "hidden",
      background: "linear-gradient(to bottom, rgba(239,246,255,0.5), #FFFFFF)",
    }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -160, right: -160, width: 320, height: 320, background: "rgba(37,99,235,0.05)", borderRadius: "50%", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: -160, left: -160, width: 320, height: 320, background: "rgba(37,99,235,0.05)", borderRadius: "50%", filter: "blur(60px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 1024, margin: "0 auto", textAlign: "center" }}>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 100 }}
          style={{ marginBottom: 32, display: "inline-block" }}
        >
          <img src="/appicon.png" alt="One Man Shop" style={{ width: 112, height: 112, borderRadius: 24, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          style={{ fontSize: 72, fontWeight: 800, color: "#0F172A", marginBottom: 16, letterSpacing: "-0.02em" }}
        >
          One Man Shop
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          style={{ fontSize: 24, color: "#64748B", marginBottom: 40, maxWidth: 640, margin: "0 auto 40px", lineHeight: 1.6 }}
        >
          Your shop deserves a simple POS.
          <br />
          <span style={{ color: "#94A3B8" }}>No subscriptions. No internet needed. Scan to pay.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 64, flexWrap: "wrap" }}
        >
          <a href="https://github.com/0yk0/one_man_shop/releases/latest" target="_blank" rel="noopener noreferrer" style={{ background: "#2563EB", color: "white", fontWeight: 600, padding: "14px 28px", borderRadius: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, fontSize: 18, boxShadow: "0 10px 15px -3px rgba(37,99,235,0.3)" }}>
            <Download size={20} /> Download for macOS
          </a>
          <a href="https://github.com/0yk0/one_man_shop/releases/latest" target="_blank" rel="noopener noreferrer" style={{ background: "#2563EB", color: "white", fontWeight: 600, padding: "14px 28px", borderRadius: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, fontSize: 18, boxShadow: "0 10px 15px -3px rgba(37,99,235,0.3)" }}>
            <Download size={20} /> Download for Windows
          </a>
          <a href="https://github.com/0yk0/one_man_shop" target="_blank" rel="noopener noreferrer" style={{ background: "white", color: "#374151", fontWeight: 600, padding: "14px 28px", borderRadius: 12, border: "2px solid #E5E7EB", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, fontSize: 18 }}>
            <Github size={20} /> View on GitHub
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          style={{ maxWidth: 896, margin: "0 auto" }}
        >
          <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: "1px solid #E2E8F0" }}>
            <img src="/screenshots/screenshot-06.png" alt="One Man Shop POS Screen" style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
