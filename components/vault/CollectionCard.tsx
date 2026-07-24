"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CollectionStatsRow } from "@/lib/supabase/types";

export default function CollectionCard({
  collection,
  index,
}: {
  collection: CollectionStatsRow;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3), ease: "easeOut" }}
      whileHover={{ y: -4 }}
    >
      <Link
        href={`/vault/${collection.id}`}
        className="block overflow-hidden rounded-[28px] border border-white/90 bg-white/90 shadow-lg shadow-slate-200/40 backdrop-blur-xl transition duration-300"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          {collection.cover_image_url ? (
            <img
              src={collection.cover_image_url}
              alt={collection.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl">
              {collection.emoji}
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm">
            {collection.emoji} {collection.item_count} {collection.item_count === 1 ? "memory" : "memories"}
          </div>
        </div>

        <div className="p-5">
          <p className="truncate text-base font-semibold text-slate-900">{collection.name}</p>
          {collection.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{collection.description}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}