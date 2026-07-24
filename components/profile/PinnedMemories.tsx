"use client";

import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { GlimpseRow } from "@/lib/supabase/types";

type Props = {
  pinnedGlimpses: GlimpseRow[];
  isOwner: boolean;
  onUnpin: (glimpseId: string) => void;
};

export default function PinnedMemories({ pinnedGlimpses, isOwner, onUnpin }: Props) {
  const toast = useToast();

  async function unpin(glimpseId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("glimpses").update({ is_pinned: false }).eq("id", glimpseId);

    if (error) {
      console.error(error);
      toast.showToast("Could not unpin memory.", "error");
      return;
    }

    onUnpin(glimpseId);
  }

  if (pinnedGlimpses.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">📌 Pinned</h2>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {pinnedGlimpses.map((glimpse, index) => (
          <motion.div
            key={glimpse.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
            className="group relative w-40 shrink-0 overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm"
          >
            <div className="aspect-square w-full overflow-hidden bg-slate-100">
              <img
                src={glimpse.image_url}
                alt={glimpse.caption ?? "Pinned memory"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
              📌 Pinned
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => unpin(glimpse.id)}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Unpin memory"
              >
                ✕
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}