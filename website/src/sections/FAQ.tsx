import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "Is One Man Shop really free?", a: "Yes, 100% free. No subscriptions, no hidden fees, no sign-up. Download it and start selling immediately." },
  { q: "Does it work without internet?", a: "Yes. One Man Shop is completely offline. All data stays on your computer — nothing is ever sent to a server." },
  { q: "What payment methods are supported?", a: "UPI (via QR code) and Cash. Customers scan a QR code to pay with any UPI app — GPay, PhonePe, Paytm, or any other." },
  { q: "Can I use it on a second monitor?", a: "Yes. Open the Customer Display on a separate screen to show your menu, running bill, and UPI QR code to customers." },
  { q: "What platforms are supported?", a: "macOS (Apple Silicon and Intel) and Windows 10 or later." },
  { q: "Can I add product images?", a: "Yes. Upload an image (up to 2 MB) for each product. Images show up on the POS screen and customer display." },
  { q: "Does it support tax?", a: "Yes. Enable tax in Settings and set a default rate. You can also override the tax rate for individual products." },
  { q: "Can I see sales reports?", a: "Yes. Built-in daily and weekly reports with charts showing revenue, UPI vs cash breakdown, and transaction counts. Export as CSV." },
  { q: "How do backups work?", a: "Automatic nightly backups to a folder you choose — OneDrive, Dropbox, or any local folder. You set how many days to keep." },
  { q: "How many products can I add?", a: "Up to 50 active products. Enough for a juice corner, tea stall, or small retail shop." },
  { q: "Can I customize the look?", a: "Yes. 35 built-in themes — switch instantly in Settings. Pick one that matches your shop's vibe." },
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-center mb-4"
        >Frequently asked questions</motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-lg text-gray-500 text-center max-w-2xl mx-auto mb-12"
        >Everything you need to know about One Man Shop.</motion.p>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <button onClick={() => setOpenIndex(isOpen ? null : i)} className="w-full flex items-center justify-between p-5 text-left bg-none border-none cursor-pointer">
                  <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                    <ChevronDown size={20} className="text-gray-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: "hidden" }}
                    >
                      <p className="px-5 pb-5 text-gray-500 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
