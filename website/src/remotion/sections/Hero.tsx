import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, staticFile } from "remotion";
import { Download, Github } from "lucide-react";

export const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconScale = spring({ frame, fps, from: 0, to: 1, config: { damping: 12, stiffness: 100 } });
  const titleOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [15, 30], [30, 0], { extrapolateRight: "clamp" });
  const taglineOpacity = interpolate(frame, [25, 40], [0, 1], { extrapolateRight: "clamp" });
  const taglineY = interpolate(frame, [25, 40], [20, 0], { extrapolateRight: "clamp" });
  const buttonsOpacity = interpolate(frame, [35, 50], [0, 1], { extrapolateRight: "clamp" });
  const buttonsY = interpolate(frame, [35, 50], [20, 0], { extrapolateRight: "clamp" });
  const screenshotOpacity = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: "clamp" });
  const screenshotY = interpolate(frame, [45, 60], [40, 0], { extrapolateRight: "clamp" });

  return (
    <section style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 24px 64px",
      background: "linear-gradient(to bottom, rgba(239,246,255,0.5), #FFFFFF)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -160, right: -160, width: 320, height: 320, background: "rgba(37,99,235,0.05)", borderRadius: "50%", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: -160, left: -160, width: 320, height: 320, background: "rgba(37,99,235,0.05)", borderRadius: "50%", filter: "blur(60px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 1024, margin: "0 auto", textAlign: "center" }}>
        <div style={{ marginBottom: 32, display: "inline-block", transform: `scale(${iconScale})` }}>
          <img src={staticFile("appicon.png")} alt="One Man Shop" style={{ width: 112, height: 112, borderRadius: 24, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }} />
        </div>

        <h1 style={{ fontSize: 72, fontWeight: 800, color: "#0F172A", marginBottom: 16, letterSpacing: "-0.02em", opacity: titleOpacity, transform: `translateY(${titleY}px)` }}>
          One Man Shop
        </h1>

        <p style={{ fontSize: 24, color: "#64748B", marginBottom: 40, maxWidth: 640, margin: "0 auto 40px", lineHeight: 1.6, opacity: taglineOpacity, transform: `translateY(${taglineY}px)` }}>
          Your shop deserves a simple POS.
          <br />
          <span style={{ color: "#94A3B8" }}>No subscriptions. No internet needed. Just scan & sell.</span>
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 64, opacity: buttonsOpacity, transform: `translateY(${buttonsY}px)`, flexWrap: "wrap" }}>
          <a href="#download" style={{ background: "#2563EB", color: "white", fontWeight: 600, padding: "14px 28px", borderRadius: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, fontSize: 18, boxShadow: "0 10px 15px -3px rgba(37,99,235,0.3)" }}>
            <Download size={20} /> Download for macOS
          </a>
          <a href="#download" style={{ background: "#2563EB", color: "white", fontWeight: 600, padding: "14px 28px", borderRadius: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, fontSize: 18, boxShadow: "0 10px 15px -3px rgba(37,99,235,0.3)" }}>
            <Download size={20} /> Download for Windows
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ background: "white", color: "#374151", fontWeight: 600, padding: "14px 28px", borderRadius: 12, border: "2px solid #E5E7EB", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, fontSize: 18 }}>
            <Github size={20} /> View on GitHub
          </a>
        </div>

        <div style={{ maxWidth: 896, margin: "0 auto", opacity: screenshotOpacity, transform: `translateY(${screenshotY}px)` }}>
          <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: "1px solid #E2E8F0" }}>
            <img src={staticFile("screenshots/screenshot-01.png")} alt="One Man Shop POS Screen" style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        </div>
      </div>
    </section>
  );
};
