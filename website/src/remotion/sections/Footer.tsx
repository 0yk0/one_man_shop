import React from "react";
import { Github, Heart } from "lucide-react";
import { staticFile } from "remotion";

export const Footer: React.FC = () => {
  return (
    <footer style={{ padding: "48px 16px", background: "#111827", color: "#9CA3AF" }}>
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              <img src={staticFile("appicon.png")} alt="" style={{ width: 32, height: 32, borderRadius: 8 }} />
              <span style={{ color: "white", fontWeight: 600, fontSize: 18 }}>One Man Shop</span>
            </div>
            <p style={{ fontSize: 14 }}>Built for small shops, by a small shop owner.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: "#9CA3AF", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
              <Github size={18} /> GitHub
            </a>
            <a href="#" style={{ color: "#9CA3AF", textDecoration: "none" }}>Docs</a>
            <a href="#" style={{ color: "#9CA3AF", textDecoration: "none" }}>Report Issue</a>
          </div>
        </div>
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #374151", textAlign: "center", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          © 2026 One Man Shop · MIT License · Made with <Heart size={14} color="#F87171" fill="#F87171" />
        </div>
      </div>
    </footer>
  );
};
