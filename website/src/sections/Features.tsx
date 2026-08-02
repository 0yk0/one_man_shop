import React from "react";
import { motion } from "framer-motion";
import { QrCode, Monitor, Package, BarChart3, Cloud, Palette } from "lucide-react";

const features = [
  { icon: QrCode, title: "UPI QR Payments", desc: "Generate UPI QR codes instantly. Customers scan & pay with any UPI app." },
  { icon: Monitor, title: "Customer Display", desc: "Show menu, bill & QR on a second screen. Your customers see everything." },
  { icon: Package, title: "Product Management", desc: "Add up to 50 products with images, prices, and tax rates." },
  { icon: BarChart3, title: "Reports & Charts", desc: "Daily & weekly sales summaries with beautiful charts. Export as CSV." },
  { icon: Cloud, title: "Auto Backups", desc: "Nightly backups to OneDrive/Dropbox. Never lose your data." },
  { icon: Palette, title: "35 Themes", desc: "Customize the look with 35 built-in DaisyUI themes." },
];

export const Features: React.FC = () => {
  return (
    <section style={{ padding: "96px 16px", background: "white" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ fontSize: 40, fontWeight: 700, textAlign: "center", marginBottom: 16 }}
        >Everything you need</motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          style={{ fontSize: 18, color: "#64748B", textAlign: "center", maxWidth: 576, margin: "0 auto 48px" }}
        >A complete POS system designed for small, single-operator shops.</motion.p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, type: "spring", damping: 15, stiffness: 100 }}
                style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              >
                <div style={{ width: 48, height: 48, background: "rgba(37,99,235,0.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon size={24} color="#2563EB" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
