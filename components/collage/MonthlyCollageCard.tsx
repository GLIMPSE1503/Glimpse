"use client";

import { motion } from "framer-motion";
import { GlimpseRow } from "@/lib/supabase/types";

type Props = {
  label: string;
  glimpses: GlimpseRow[];
  index: number;
  onCreateCollage: () => void;
};

export default function MonthlyCollageCard({ label, glimpses, index, onCreateCollage }: Props) {
  const previewImages = glimpses.slice(0, 4);
  const remainingSlots = Math.max(0, 4 - previewImages.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="overflow-hidden rounded-[28px] border border-white/90 bg-white/90 shadow-lg shadow-slate-200/40 backdrop-blur-xl transition duration-300"
    >
      <div className="grid grid-cols-2 gap-1 p-1">
        {previewImages.map((glimpse) => (
          <div key={glimpse.id} className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
            <img
              src={glimpse.image_url}
              alt={glimpse.caption ?? "Memory"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
        {Array.from({ length: remainingSlots }).map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className="flex aspect-square items-center justify-center rounded-2xl bg-slate-50 text-slate-300"
          >
            <span className="text-2xl">✨</span>
          </div>
        ))}
      </div>

      <div className="p-5">
        <h2 className="text-base font-semibold text-slate-900">{label}</h2>
        <p className="text-xs text-slate-400">
          {glimpses.length} {glimpses.length === 1 ? "memory" : "memories"}
        </p>

       <button
  type="button"
  onClick={onCreateCollage}
  className="mt-5 w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
>
  Generate Collage
</button>
      </div>
    </motion.div>
  );
}