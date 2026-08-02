"use client";

import { motion } from "framer-motion";
import { GlimpseStatsRow } from "@/lib/supabase/types";

function formatShortDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(dateString)
  );
}

type Props = {
  glimpses: GlimpseStatsRow[];
  onSelect: (index: number) => void;
};

export default function ArchiveGrid({ glimpses, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {glimpses.map((glimpse, index) => (
        <motion.button
          key={glimpse.id}
          type="button"
          onClick={() => onSelect(index)}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3), ease: "easeOut" }}
          whileHover={{ y: -4 }}
          className="group overflow-hidden rounded-[24px] border border-white/90 bg-white/90 text-left shadow-md shadow-slate-200/40 backdrop-blur-xl transition duration-300"
        >
          <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
            <img
              src={glimpse.image_url}
              alt={glimpse.caption ?? "Archived memory"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute left-2 top-2 rounded-full bg-slate-950/60 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              📦 Archived
            </div>
          </div>

          <div className="p-3.5">
            <p className="line-clamp-1 text-sm font-medium text-slate-900">
              {glimpse.caption || "Untitled Memory ✨"}
            </p>
            <div className="mt-2 space-y-0.5 text-[11px] text-slate-400">
              <p>Uploaded {formatShortDate(glimpse.created_at)}</p>
              <p>Archived {formatShortDate(glimpse.archived_at ?? glimpse.expires_at)}</p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}