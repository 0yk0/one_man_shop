import React from "react";
import { motion } from "framer-motion";
import { Star, Download, Users, MapPin } from "lucide-react";
import { useGitHubStats } from "../hooks/useGitHubStats";

const items = [
  { icon: Star, text: "stars on GitHub", color: "text-amber-400" },
  { icon: Download, text: "downloads", color: "text-blue-400" },
  { icon: Users, text: "shop owners using it", color: "text-green-400" },
  { icon: MapPin, text: "shops across India", color: "text-purple-400" },
];

export const SocialProofTicker: React.FC = () => {
  const { stars, downloads, loading } = useGitHubStats();

  // Simulated data for users and shops (replace with real data when available)
  const stats = [
    { ...items[0], value: stars },
    { ...items[1], value: downloads },
    { ...items[2], value: 50 }, // Simulated
    { ...items[3], value: 20 }, // Simulated
  ];

  if (loading) {
    return null;
  }

  return (
    <section className="py-4 bg-gray-50 border-y border-gray-100 overflow-hidden">
      <div className="ticker-animation flex whitespace-nowrap">
        {/* Duplicate items for seamless loop */}
        {[...stats, ...stats].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="inline-flex items-center gap-2 px-8 text-gray-600"
            >
              <Icon size={16} className={stat.color} />
              <span className="font-semibold">{stat.value.toLocaleString()}</span>
              <span className="text-gray-400">{stat.text}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
