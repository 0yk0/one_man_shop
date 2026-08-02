import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Download, Package, QrCode } from "lucide-react";

const steps = [
  { icon: Download, number: "1", title: "Download & install", desc: "Free download for macOS or Windows. Takes less than a minute." },
  { icon: Package, number: "2", title: "Add your products", desc: "Set up your product list with names, prices, and images." },
  { icon: QrCode, number: "3", title: "Start selling", desc: "Tap products, generate UPI QR, and complete sales instantly." },
];

export const HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <section style={{ padding: "96px 16px", background: "white" }}>
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        <h2 style={{ fontSize: 40, fontWeight: 700, textAlign: "center", marginBottom: 16 }}>Start selling in 3 steps</h2>
        <p style={{ fontSize: 18, color: "#64748B", textAlign: "center", maxWidth: 576, margin: "0 auto 48px" }}>Takes less than 2 minutes. Seriously.</p>

        <div style={{ position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {steps.map((step, i) => {
              const delay = i * 12;
              const stepScale = spring({ frame: frame - delay, fps, from: 0, to: 1, config: { damping: 12, stiffness: 100 } });
              const Icon = step.icon;
              return (
                <div key={step.number} style={{ textAlign: "center", transform: `scale(${stepScale})` }}>
                  <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, background: "#2563EB", borderRadius: 16, boxShadow: "0 10px 15px -3px rgba(37,99,235,0.3)", marginBottom: 24 }}>
                    <Icon size={28} color="white" />
                    <span style={{ position: "absolute", top: -8, right: -8, width: 24, height: 24, background: "#111827", color: "white", fontSize: 12, fontWeight: 700, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{step.number}</span>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ color: "#64748B", maxWidth: 256, margin: "0 auto" }}>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
