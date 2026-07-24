"use client";

import { motion } from "framer-motion";
import AnimatedNumber from "@/components/shared/AnimatedNumber";
import { MemoryStatsRow } from "@/lib/supabase/types";

export default function MemoryStatsCards({
  stats,
  streak,
}: {
  stats: MemoryStatsRow;
  streak: number;
}) {
  const items = [
    { label: "Total Memories", value: stats.total_memories, icon: "🖼️" },
    { label: "Archived", value: stats.archived_memories, icon: "🗄️" },
    { label: "Collections", value: stats.collections_count, icon: "📁" },
    { label: "Likes Received", value: stats.likes_received, icon: "❤️" },
    { label: "Comments Received", value: stats.comments_received, icon: "💬" },
    { label: "Current Streak", value: streak, icon: "🔥", suffix: streak === 1 ? " day" : " days" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
          whileHover={{ y: -4 }}
          className="flex flex-col items-center gap-1 rounded-3xl border border-white/90 bg-white/90 px-4 py-5 text-center shadow-md shadow-slate-200/40 backdrop-blur-xl"
        >
          <span className="text-xl" aria-hidden="true">
            {item.icon}
          </span>
          <span className="text-xl font-semibold text-slate-900">
            <AnimatedNumber value={item.value} />
            {item.suffix}
          </span>
          <span className="text-xs text-slate-500">{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
}