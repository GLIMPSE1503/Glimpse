"use client";

import { motion } from "framer-motion";

type Stats = {
  memoriesCount: number;
  likesReceived: number;
  commentsReceived: number;
  favoritesCount: number;
};

export default function ProfileStats({ stats }: { stats: Stats }) {
  const items = [
    { label: "Memories", value: stats.memoriesCount, icon: "🖼️" },
    { label: "Likes Received", value: stats.likesReceived, icon: "❤️" },
    { label: "Comments Received", value: stats.commentsReceived, icon: "💬" },
    { label: "Favorites", value: stats.favoritesCount, icon: "★" },
  ];

  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 * index }}
          whileHover={{ y: -4 }}
          className="flex flex-col items-center gap-1 rounded-3xl border border-white/90 bg-white/90 px-4 py-5 text-center shadow-md shadow-slate-200/40 backdrop-blur-xl"
        >
          <span className="text-xl" aria-hidden="true">
            {item.icon}
          </span>
          <span className="text-xl font-semibold text-slate-900">{item.value}</span>
          <span className="text-xs text-slate-500">{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
}