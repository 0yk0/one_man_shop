import React from "react";
import { motion } from "framer-motion";
import { Shield, Wifi, Heart, Database } from "lucide-react";

const badges = [
  { icon: Heart, text: "Free forever" },
  { icon: Wifi, text: "Works offline" },
  { icon: Shield, text: "Open source" },
  { icon: Database, text: "Your data stays local" },
];

export const TrustBar: React.FC = () => {
  return (
    <section className="py-8 px-4 bg-gray-50 border-y border-gray-100">
      <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16">
        {badges.map((badge, i) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.text}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", damping: 12, stiffness: 100 }}
              className="flex items-center gap-2 text-gray-600"
            >
              <Icon size={18} className="text-blue-600" />
              <span className="font-medium text-sm">{badge.text}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
