import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Apple, Monitor } from "lucide-react";

export const DownloadCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, from: 0.9, to: 1, config: { damping: 15, stiffness: 100 } });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <section id="download" style={{ padding: "96px 16px", background: "linear-gradient(to bottom, #FFFFFF, rgba(239,246,255,0.5))" }}>
      <div style={{ maxWidth: 896, margin: "0 auto", textAlign: "center", opacity, transform: `scale(${scale})` }}>
        <h2 style={{ fontSize: 48, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Ready to simplify your shop?</h2>
        <p style={{ fontSize: 20, color: "#64748B", marginBottom: 40 }}>Free download. No sign-up. No internet required.</p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 32, flexWrap: "wrap" }}>
          <a href="#" style={{ background: "#2563EB", color: "white", fontWeight: 600, padding: "16px 32px", borderRadius: 16, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 12, fontSize: 18, boxShadow: "0 10px 15px -3px rgba(37,99,235,0.3)" }}>
            <Apple size={24} /> Download for macOS
          </a>
          <a href="#" style={{ background: "#2563EB", color: "white", fontWeight: 600, padding: "16px 32px", borderRadius: 16, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 12, fontSize: 18, boxShadow: "0 10px 15px -3px rgba(37,99,235,0.3)" }}>
            <Monitor size={24} /> Download for Windows
          </a>
        </div>
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>Works on macOS 12+ and Windows 10+ · Version 0.1.0 · MIT License</p>
      </div>
    </section>
  );
};
