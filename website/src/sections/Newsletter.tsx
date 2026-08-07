import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Check } from "lucide-react";

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // In production, this would submit to a newsletter service
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <section className="py-16 px-4 bg-blue-600">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl mb-4">
            <Mail size={24} className="text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Stay updated
          </h2>
          <p className="text-blue-100 mb-8 max-w-lg mx-auto">
            Get notified about new features, updates, and tips for running your shop. No spam, ever.
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl"
            >
              <Check size={20} />
              <span>Thanks for subscribing!</span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-4 py-3 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-blue-200 focus:outline-none focus:border-white/40 transition-colors"
              />
              <button
                type="submit"
                className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
              >
                Subscribe <ArrowRight size={18} />
              </button>
            </form>
          )}

          <p className="text-blue-200 text-sm mt-4">
            Join 500+ shop owners and developers. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
