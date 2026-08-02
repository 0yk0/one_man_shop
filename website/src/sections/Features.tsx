import React from "react";
import { motion } from "framer-motion";
import { QrCode, Monitor, Package, BarChart3, Cloud, Palette } from "lucide-react";

const features = [
  { icon: QrCode, title: "UPI QR Payments", desc: "Generate a QR code in one tap. Customers pay with GPay, PhonePe, Paytm, or any UPI app." },
  { icon: Monitor, title: "Customer Display", desc: "Show your menu, live bill, and payment QR on a second screen for customers to see." },
  { icon: Package, title: "Product Management", desc: "Add up to 50 products with images, prices, and optional tax rates." },
  { icon: BarChart3, title: "Sales Reports", desc: "Daily and weekly reports with revenue charts and UPI vs cash breakdown. Export as CSV." },
  { icon: Cloud, title: "Auto Backups", desc: "Nightly backups to OneDrive, Dropbox, or any folder you choose. Never lose data." },
  { icon: Palette, title: "35 Themes", desc: "Switch between 35 built-in themes instantly. Light, dark, and everything in between." },
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
        >Everything you need to run your shop — nothing you don't.</motion.p>

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
