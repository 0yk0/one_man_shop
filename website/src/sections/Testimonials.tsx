import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "I don't care about the technology. I care that I can see how much I sold today. And that it didn't crash during morning rush hour.",
    name: "Rajesh K.",
    role: "Tea Shop Owner, Bangalore",
    avatar: " chai",
  },
  {
    quote: "The customer display changed everything. My customers can now see the bill before paying. No more confusion about prices.",
    name: "Priya M.",
    role: "Cafe Owner, Hyderabad",
    avatar: " ☕",
  },
  {
    quote: "I was paying ₹1,500/month for a POS that needed internet. One Man Shop works offline and costs nothing. Best decision I made.",
    name: "Suresh R.",
    role: "Kirana Store, Mumbai",
    avatar: " 🏪",
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-center mb-4"
        >
          Loved by shop owners
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-lg text-gray-500 text-center max-w-2xl mx-auto mb-12"
        >
          Real feedback from real shop owners using One Man Shop every day.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <Quote size={24} className="text-blue-600/20 mb-4" />
              <p className="text-gray-700 leading-relaxed mb-6 italic">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
