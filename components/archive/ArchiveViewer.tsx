"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GlimpseStatsRow } from "@/lib/supabase/types";

function formatFullDateTime(dateString: string | null) {
  if (!dateString) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

type Props = {
  glimpses: GlimpseStatsRow[];
  selectedIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export default function ArchiveViewer({ glimpses, selectedIndex, onClose, onNavigate }: Props) {
  const selected = selectedIndex === null ? null : glimpses[selectedIndex] ?? null;

  useEffect(() => {
    if (selectedIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && selectedIndex !== null && selectedIndex < glimpses.length - 1) {
        onNavigate(selectedIndex + 1);
      }
      if (event.key === "ArrowLeft" && selectedIndex !== null && selectedIndex > 0) {
        onNavigate(selectedIndex - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, glimpses.length, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {selected ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950 shadow-2xl"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 text-white shadow-lg shadow-slate-900/40 transition hover:bg-slate-800"
              aria-label="Close viewer"
            >
              ✕
            </button>

            {selectedIndex !== null && selectedIndex > 0 && (
              <button
                type="button"
                onClick={() => onNavigate(selectedIndex - 1)}
                className="absolute left-4 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-white shadow-lg shadow-slate-900/40 transition hover:bg-slate-800"
                aria-label="Previous archived memory"
              >
                ‹
              </button>
            )}

            {selectedIndex !== null && selectedIndex < glimpses.length - 1 && (
              <button
                type="button"
                onClick={() => onNavigate(selectedIndex + 1)}
                className="absolute right-4 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-white shadow-lg shadow-slate-900/40 transition hover:bg-slate-800"
                aria-label="Next archived memory"
              >
                ›
              </button>
            )}

            <img
              src={selected.image_url}
              alt={selected.caption ?? "Archived memory"}
              className="h-[80vh] w-full object-contain"
            />

            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent p-6 pt-16">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-slate-900">
                📦 Archived — read only
              </div>

              <p className="text-base font-medium text-white">
                {selected.caption || "Untitled Memory ✨"}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/70">
                <span>🕒 Uploaded {formatFullDateTime(selected.created_at)}</span>
                <span>⌛ Expired {formatFullDateTime(selected.expires_at)}</span>
                <span>
                  ❤️ {selected.like_count} {selected.like_count === 1 ? "like" : "likes"}
                </span>
                <span>
                  💬 {selected.comment_count} {selected.comment_count === 1 ? "comment" : "comments"}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}