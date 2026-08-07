import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Package, Palette, Clock, IndianRupee } from "lucide-react";

interface StatItem {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  color: string;
}

const stats: StatItem[] = [
  { icon: Package, value: 50, suffix: "+", label: "Products", color: "text-blue-500" },
  { icon: Palette, value: 35, suffix: "", label: "Themes", color: "text-purple-500" },
  { icon: Clock, value: 2, suffix: " min", label: "Setup time", color: "text-green-500" },
  { icon: IndianRupee, value: 0, suffix: "", label: "Forever", color: "text-amber-500" },
];

const AnimatedCounter: React.FC<{
  value: number;
  suffix: string;
  isInView: boolean;
}> = ({ value, suffix, isInView }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = value;
    const duration = 1500;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
};

export const AnimatedStats: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 px-4 bg-white border-y border-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 mb-3 ${stat.color}`}>
                  <Icon size={24} />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    isInView={isInView}
                  />
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
