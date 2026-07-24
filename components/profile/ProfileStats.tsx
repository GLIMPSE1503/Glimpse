"use client";

import { motion } from "framer-motion";
import AnimatedNumber from "@/components/shared/AnimatedNumber";

type Stats = {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesReceived: number;
};

export default function ProfileStats({ stats }: { stats: Stats }) {
  const items = [
    { label: "Posts", value: stats.postsCount, icon: "🖼️" },
    { label: "Followers", value: stats.followersCount, icon: "👥" },
    { label: "Following", value: stats.followingCount, icon: "➡️" },
    { label: "Likes Received", value: stats.likesReceived, icon: "❤️" },
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
          <span className="text-xl font-semibold text-slate-900">
            <AnimatedNumber value={item.value} />
          </span>
          <span className="text-xs text-slate-500">{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
}