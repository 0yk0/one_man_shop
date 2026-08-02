import React, { useState } from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "Is One Man Shop really free?", a: "Yes, 100% free. No subscriptions, no hidden fees, no sign-up required. Download it and start using it immediately." },
  { q: "Does it work without internet?", a: "Absolutely. One Man Shop is offline-first. All data stays on your computer using PocketBase (SQLite). No internet required for any feature." },
  { q: "What payment methods are supported?", a: "UPI (via QR code) and Cash. Customers scan a QR code to pay via any UPI app (GPay, PhonePe, Paytm, etc.)." },
  { q: "Can I use it on a second monitor?", a: "Yes! The Customer Display window can be opened on a separate screen, showing your menu, bill, and UPI QR code to customers." },
  { q: "What platforms are supported?", a: "macOS (Apple Silicon + Intel) and Windows 10+. Linux support is planned for the future." },
  { q: "Is my data safe?", a: "All data is stored locally on your computer. Nothing is sent to any server. You own your data completely." },
  { q: "Can I export my sales data?", a: "Yes, you can export transactions as CSV with date range filtering. Perfect for accounting and tax filing." },
  { q: "How do backups work?", a: "Automatic nightly backups to a folder of your choice (e.g., OneDrive, Dropbox). Configurable retention period to manage storage." },
  { q: "How many products can I add?", a: "Up to 50 active products. This keeps the interface fast and focused for small shops." },
  { q: "Can I customize the look?", a: "Yes, 35 built-in themes to choose from. Switch themes instantly in Settings." },
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <section style={{ padding: "96px 16px", background: "#F8FAFC" }}>
      <div style={{ maxWidth: 768, margin: "0 auto" }}>
        <h2 style={{ fontSize: 40, fontWeight: 700, textAlign: "center", marginBottom: 16 }}>Frequently asked questions</h2>
        <p style={{ fontSize: 18, color: "#64748B", textAlign: "center", maxWidth: 576, margin: "0 auto 48px" }}>Everything you need to know about One Man Shop.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((faq, i) => {
            const delay = i * 3;
            const itemScale = spring({ frame: frame - delay, fps, from: 0, to: 1, config: { damping: 15, stiffness: 100 } });
            const isOpen = openIndex === i;
            return (
              <div key={i} style={{ background: "white", borderRadius: 12, border: "1px solid #F1F5F9", overflow: "hidden", transform: `scale(${itemScale})` }}>
                <button onClick={() => setOpenIndex(isOpen ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}>
                  <span style={{ fontWeight: 500, color: "#0F172A", fontSize: 16, paddingRight: 16 }}>{faq.q}</span>
                  <ChevronDown size={20} color="#9CA3AF" style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                </button>
                <div style={{ maxHeight: isOpen ? 160 : 0, overflow: "hidden", transition: "max-height 0.3s" }}>
                  <p style={{ padding: "0 20px 20px", color: "#64748B", lineHeight: 1.6 }}>{faq.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
