import React from "react";
import { motion } from "framer-motion";
import { QrCode, Monitor, Package, BarChart3, Cloud, Palette } from "lucide-react";

const features = [
  { icon: QrCode, title: "UPI QR Payments", desc: "Generate a QR code in one tap. Customers pay with GPay, PhonePe, Paytm, or any UPI app." },
  { icon: Monitor, title: "Customer Display", desc: "Show your menu, live bill, and payment QR on a second screen for customers to see." },
  { icon: Package, title: "Product Management", desc: "Add up to 50 products with images, prices, and optional tax rates." },
  { icon: BarChart3, title: "Sales Reports", desc: "Daily and weekly reports with revenue charts and UPI vs cash breakdown. Export as CSV." },
  { icon: Cloud, title: "Auto Backups", desc: "Nightly backups to OneDrive, Dropbox, or any folder you choose. Never lose data." },
  { icon: Palette, title: "35 Themes", desc: "Switch between 35 built-in themes instantly. Light, dark, and everything in between." },
];

export const Features: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-center mb-4"
        >Everything you need to run your shop — nothing you don&apos;t.</motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-lg text-gray-500 text-center max-w-2xl mx-auto mb-12"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, type: "spring", damping: 15, stiffness: 100 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={24} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
