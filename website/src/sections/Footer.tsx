import React from "react";
import { Github, Heart, Linkedin, Globe } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer style={{ padding: "48px 16px", background: "#111827", color: "#9CA3AF" }}>
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              <img src="/appicon.png" alt="" style={{ width: 32, height: 32, borderRadius: 8 }} />
              <span style={{ color: "white", fontWeight: 600, fontSize: 18 }}>One Man Shop</span>
            </div>
            <p style={{ fontSize: 14 }}>Built for a friend's small shop. Made open source for everyone.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="https://github.com/0yk0/one_man_shop" target="_blank" rel="noopener noreferrer" style={{ color: "#9CA3AF", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
              <Github size={18} /> GitHub
            </a>
            <a href="#faq" style={{ color: "#9CA3AF", textDecoration: "none" }}>FAQ</a>
            <a href="https://github.com/0yk0/one_man_shop/issues" target="_blank" rel="noopener noreferrer" style={{ color: "#9CA3AF", textDecoration: "none" }}>Report Issue</a>
          </div>
        </div>
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #374151", textAlign: "center", fontSize: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 12 }}>
            Built with <Heart size={14} color="#F87171" fill="#F87171" /> by{" "}
            <a href="https://yk0.in" target="_blank" rel="noopener noreferrer" style={{ color: "white", textDecoration: "none", fontWeight: 500 }}>Yatheesh</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 12 }}>
            <a href="https://github.com/0yk0" target="_blank" rel="noopener noreferrer" style={{ color: "#9CA3AF", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
              <Github size={16} /> GitHub
            </a>
            <a href="https://linkedin.com/in/yatheeshkonduru" target="_blank" rel="noopener noreferrer" style={{ color: "#9CA3AF", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
              <Linkedin size={16} /> LinkedIn
            </a>
            <a href="https://yk0.in" target="_blank" rel="noopener noreferrer" style={{ color: "#9CA3AF", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
              <Globe size={16} /> Website
            </a>
          </div>
          <p style={{ color: "#6B7280" }}>© 2026 One Man Shop · MIT License</p>
        </div>
      </div>
    </footer>
  );
};
