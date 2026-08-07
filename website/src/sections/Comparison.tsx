import React from "react";
import { motion } from "framer-motion";
import { Check, X, DollarSign, Smartphone, Wifi, Monitor, Lock, Database, Printer, BarChart, Clock } from "lucide-react";

const features = [
  { 
    name: "Price", 
    ours: "Free forever", 
    others: "Monthly fees",
    icon: DollarSign,
  },
  { 
    name: "UPI Support", 
    ours: true, 
    others: false,
    icon: Smartphone,
  },
  { 
    name: "Offline Mode", 
    ours: true, 
    others: "Limited",
    icon: Wifi,
  },
  { 
    name: "Customer Display", 
    ours: true, 
    others: "Paid add-on",
    icon: Monitor,
  },
  { 
    name: "Open Source", 
    ours: true, 
    others: false,
    icon: Lock,
  },
  { 
    name: "Data Ownership", 
    ours: true, 
    others: "Cloud only",
    icon: Database,
  },
  { 
    name: "Receipt Printing", 
    ours: true, 
    others: true,
    icon: Printer,
  },
  { 
    name: "Sales Reports", 
    ours: true, 
    others: true,
    icon: BarChart,
  },
  { 
    name: "Android App", 
    ours: true, 
    others: true,
    icon: Smartphone,
  },
  { 
    name: "Setup Time", 
    ours: "2 minutes", 
    others: "30+ minutes",
    icon: Clock,
  },
];

const renderCell = (value: boolean | string, isOurs: boolean = false) => {
  if (value === true) {
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${isOurs ? 'bg-green-500' : 'bg-green-100'}`}>
        <Check size={16} className={isOurs ? 'text-white' : 'text-green-600'} />
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
        <X size={16} className="text-gray-400" />
      </div>
    );
  }
  return <span className={`text-sm font-medium ${isOurs ? 'text-green-600' : 'text-gray-500'}`}>{value}</span>;
};

export const Comparison: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block text-sm font-semibold text-blue-600 bg-blue-100 px-4 py-2 rounded-full mb-4"
          >
            WHY CHOOSE US
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4"
          >
            Built different
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-500 max-w-2xl mx-auto"
          >
            See what makes One Man Shop the right choice for small shops.
          </motion.p>
        </motion.div>

        {/* Feature Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
            <div className="p-5 font-semibold text-gray-600 text-sm">Feature</div>
            <div className="p-5 font-bold text-blue-600 text-sm text-center bg-blue-50">One Man Shop</div>
            <div className="p-5 font-semibold text-gray-500 text-sm text-center">Others</div>
          </div>

          {/* Rows */}
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`grid grid-cols-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                }`}
              >
                <div className="p-5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Icon size={16} className="text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{feature.name}</span>
                </div>
                <div className="p-5 text-center flex items-center justify-center bg-blue-50/30">
                  {renderCell(feature.ours, true)}
                </div>
                <div className="p-5 text-center flex items-center justify-center">
                  {renderCell(feature.others)}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <a
            href="#download"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Try One Man Shop Free →
          </a>
        </motion.div>
      </div>
    </section>
  );
};
