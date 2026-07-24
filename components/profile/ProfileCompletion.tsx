"use client";

import { motion } from "framer-motion";
import { ProfileRow } from "@/lib/supabase/types";

export default function ProfileCompletion({
  profile,
  hasAtLeastOneMemory,
}: {
  profile: ProfileRow;
  hasAtLeastOneMemory: boolean;
}) {
  const checks = [
    { label: "Profile photo", done: !!profile.avatar_url },
    { label: "Cover photo", done: !!profile.cover_url },
    { label: "Full name", done: !!profile.full_name },
    { label: "Bio", done: !!profile.bio },
    { label: "First memory uploaded", done: hasAtLeastOneMemory },
  ];

  const completedCount = checks.filter((c) => c.done).length;
  const percentage = Math.round((completedCount / checks.length) * 100);

  if (percentage === 100) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border border-white/90 bg-white/90 p-5 shadow-md shadow-slate-200/40 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Complete your profile</p>
        <span className="text-sm font-semibold text-purple-600">{percentage}%</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-purple-500"
        />
      </div>

      <ul className="mt-4 space-y-1.5">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-2 text-xs text-slate-500">
            <span className={check.done ? "text-emerald-500" : "text-slate-300"}>
              {check.done ? "✓" : "○"}
            </span>
            <span className={check.done ? "text-slate-400 line-through" : ""}>{check.label}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}