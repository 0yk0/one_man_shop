import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Shield, Wifi, Heart, Database } from "lucide-react";

const badges = [
  { icon: Heart, text: "Free forever" },
  { icon: Wifi, text: "Works offline" },
  { icon: Shield, text: "Open source" },
  { icon: Database, text: "Your data stays local" },
];

export const TrustBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <section style={{ padding: "32px 16px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9", borderBottom: "1px solid #F1F5F9" }}>
      <div style={{ maxWidth: 1024, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 48 }}>
        {badges.map((badge, i) => {
          const scale = spring({ frame: frame - i * 5, fps, from: 0, to: 1, config: { damping: 12, stiffness: 100 } });
          const Icon = badge.icon;
          return (
            <div key={badge.text} style={{ display: "flex", alignItems: "center", gap: 8, color: "#4B5563", transform: `scale(${scale})` }}>
              <Icon size={18} color="#2563EB" />
              <span style={{ fontWeight: 500, fontSize: 14 }}>{badge.text}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
