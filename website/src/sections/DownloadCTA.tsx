import React from "react";
import { motion } from "framer-motion";
import { Apple, Monitor } from "lucide-react";

export const DownloadCTA: React.FC = () => {
  return (
    <section id="download" style={{ padding: "96px 16px", background: "linear-gradient(to bottom, #FFFFFF, rgba(239,246,255,0.5))" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        style={{ maxWidth: 896, margin: "0 auto", textAlign: "center" }}
      >
        <h2 style={{ fontSize: 48, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Ready to simplify your shop?</h2>
        <p style={{ fontSize: 20, color: "#64748B", marginBottom: 40 }}>Free download. No sign-up. No internet required.</p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 32, flexWrap: "wrap" }}>
          <a href="https://github.com/0yk0/one_man_shop/releases/latest" target="_blank" rel="noopener noreferrer" style={{ background: "#2563EB", color: "white", fontWeight: 600, padding: "16px 32px", borderRadius: 16, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 12, fontSize: 18, boxShadow: "0 10px 15px -3px rgba(37,99,235,0.3)" }}>
            <Apple size={24} /> Download for macOS
          </a>
          <a href="https://github.com/0yk0/one_man_shop/releases/latest" target="_blank" rel="noopener noreferrer" style={{ background: "#2563EB", color: "white", fontWeight: 600, padding: "16px 32px", borderRadius: 16, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 12, fontSize: 18, boxShadow: "0 10px 15px -3px rgba(37,99,235,0.3)" }}>
            <Monitor size={24} /> Download for Windows
          </a>
        </div>
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>Works on macOS 12+ and Windows 10+ · Open source · MIT License</p>
      </motion.div>
    </section>
  );
};
