import React from "react";
import { motion } from "framer-motion";
import { Wifi, Monitor, CreditCard, BarChart3, Check } from "lucide-react";

const points = [
  { icon: Wifi, problem: "\"My POS needs internet and crashes during rush hour\"", solution: "Works completely offline. No WiFi? No problem." },
  { icon: Monitor, problem: "\"I can't see what my customer sees\"", solution: "Customer Display shows menu, bill & QR on a second screen." },
  { icon: CreditCard, problem: "\"I pay monthly fees for a POS I barely use\"", solution: "100% free. No hidden charges. Ever." },
  { icon: BarChart3, problem: "\"I have no idea how much I sold today\"", solution: "Built-in reports with daily & weekly charts, CSV export." },
];

export const PainPoints: React.FC = () => {
  return (
    <section style={{ padding: "96px 16px", background: "white" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ fontSize: 40, fontWeight: 700, textAlign: "center", marginBottom: 16 }}
        >Built for real shop problems</motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          style={{ fontSize: 18, color: "#64748B", textAlign: "center", maxWidth: 576, margin: "0 auto 48px" }}
        >We know what small shop owners deal with every day.</motion.p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: 24 }}>
          {points.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flexShrink: 0, width: 48, height: 48, background: "rgba(37,99,235,0.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={24} color="#2563EB" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#94A3B8", fontSize: 14, marginBottom: 4, textDecoration: "line-through", textDecorationColor: "#FCA5A5" }}>{p.problem}</p>
                    <p style={{ color: "#0F172A", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                      <Check size={16} color="#22C55E" style={{ flexShrink: 0 }} />
                      {p.solution}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
