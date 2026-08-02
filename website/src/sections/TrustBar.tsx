import React from "react";
import { motion } from "framer-motion";
import { Shield, Wifi, Heart, Database } from "lucide-react";

const badges = [
  { icon: Heart, text: "Free forever" },
  { icon: Wifi, text: "Works offline" },
  { icon: Shield, text: "Open source" },
  { icon: Database, text: "Your data stays local" },
];

export const TrustBar: React.FC = () => {
  return (
    <section style={{ padding: "32px 16px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9", borderBottom: "1px solid #F1F5F9" }}>
      <div style={{ maxWidth: 1024, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 48 }}>
        {badges.map((badge, i) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.text}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", damping: 12, stiffness: 100 }}
              style={{ display: "flex", alignItems: "center", gap: 8, color: "#4B5563" }}
            >
              <Icon size={18} color="#2563EB" />
              <span style={{ fontWeight: 500, fontSize: 14 }}>{badge.text}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
