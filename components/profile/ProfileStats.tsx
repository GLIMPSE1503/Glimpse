"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedNumber from "@/components/shared/AnimatedNumber";

type Stats = {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesReceived: number;
};

type Props = {
  stats: Stats;
  profileUserId: string;
};

export default function ProfileStats({ stats, profileUserId }: Props) {
  const items: { label: string; value: number; icon: string; href?: string }[] = [
    { label: "Posts", value: stats.postsCount, icon: "🖼️" },
    { label: "Followers", value: stats.followersCount, icon: "👥", href: `/followers?user=${profileUserId}` },
    { label: "Following", value: stats.followingCount, icon: "➡️", href: `/following?user=${profileUserId}` },
    { label: "Likes Received", value: stats.likesReceived, icon: "❤️" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item, index) => {
        const content = (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 * index }}
            whileHover={{ y: -4 }}
            className="flex flex-col items-center gap-1 rounded-3xl border border-white/90 bg-white/90 px-4 py-5 text-center shadow-md shadow-slate-200/40 backdrop-blur-xl transition"
          >
            <span className="text-xl" aria-hidden="true">
              {item.icon}
            </span>
            <span className="text-xl font-semibold text-slate-900">
              <AnimatedNumber value={item.value} />
            </span>
            <span className="text-xs text-slate-500">{item.label}</span>
          </motion.div>
        );

        return item.href ? (
          <Link key={item.label} href={item.href}>
            {content}
          </Link>
        ) : (
          <div key={item.label}>{content}</div>
        );
      })}
    </div>
  );
}