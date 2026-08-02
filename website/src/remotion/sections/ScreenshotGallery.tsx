import React, { useState } from "react";
import { useCurrentFrame, interpolate, staticFile } from "remotion";

const tabs = [
  { id: "pos", label: "POS Screen", image: staticFile("screenshots/screenshot-01.png") },
  { id: "products", label: "Products", image: staticFile("screenshots/screenshot-02.png") },
  { id: "reports", label: "Reports", image: staticFile("screenshots/screenshot-03.png") },
  { id: "settings", label: "Settings", image: staticFile("screenshots/screenshot-04.png") },
  { id: "display", label: "Customer Display", image: staticFile("screenshots/screenshot-05.png") },
];

export const ScreenshotGallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const frame = useCurrentFrame();
  const sectionOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const sectionY = interpolate(frame, [0, 15], [30, 0], { extrapolateRight: "clamp" });

  return (
    <section style={{ padding: "96px 16px", background: "#F8FAFC" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>
        <h2 style={{ fontSize: 40, fontWeight: 700, textAlign: "center", marginBottom: 16 }}>See it in action</h2>
        <p style={{ fontSize: 18, color: "#64748B", textAlign: "center", maxWidth: 576, margin: "0 auto 48px" }}>A clean, intuitive interface designed for speed.</p>

        <div style={{ opacity: sectionOpacity, transform: `translateY(${sectionY}px)` }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 32 }}>
            {tabs.map((tab, i) => (
              <button key={tab.id} onClick={() => setActiveTab(i)} style={{
                padding: "10px 20px", borderRadius: 999, fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer",
                background: activeTab === i ? "#2563EB" : "white", color: activeTab === i ? "white" : "#4B5563",
                boxShadow: activeTab === i ? "0 10px 15px -3px rgba(37,99,235,0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
                transition: "all 0.2s",
              }}>{tab.label}</button>
            ))}
          </div>

          <div style={{ maxWidth: 896, margin: "0 auto" }}>
            <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: "1px solid #E2E8F0", background: "white" }}>
              <img src={tabs[activeTab].image} alt={tabs[activeTab].label} style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
