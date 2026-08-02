import React from "react";
import { useCurrentFrame, interpolate, staticFile } from "remotion";

export const Navbar: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid #F1F5F9", opacity }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 16px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={staticFile("appicon.png")} alt="" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <span style={{ fontWeight: 700, color: "#0F172A", fontSize: 18 }}>One Man Shop</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="#features" style={{ fontSize: 14, color: "#4B5563", textDecoration: "none" }}>Features</a>
          <a href="#screenshots" style={{ fontSize: 14, color: "#4B5563", textDecoration: "none" }}>Screenshots</a>
          <a href="#faq" style={{ fontSize: 14, color: "#4B5563", textDecoration: "none" }}>FAQ</a>
          <a href="#download" style={{ background: "#2563EB", color: "white", fontSize: 14, fontWeight: 600, padding: "8px 16px", borderRadius: 8, textDecoration: "none" }}>Download</a>
        </div>
      </div>
    </nav>
  );
};
