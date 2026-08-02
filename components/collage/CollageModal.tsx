"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toPng } from "html-to-image";
import CollagePreview from "@/components/collage/CollagePreview";
import { GlimpseRow } from "@/lib/supabase/types";

type Props = {
  monthLabel: string;
  glimpses: GlimpseRow[];
  onClose: () => void;
};

export default function CollageModal({
  monthLabel,
  glimpses,
  onClose,
}: Props) {
  const collageRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function downloadCollage() {
    if (!collageRef.current || downloading) return;

    try {
      setDownloading(true);

      const dataUrl = await toPng(collageRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `${monthLabel}-Collage.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Failed to download collage.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Monthly Collage
              </h2>
              <p className="text-sm text-slate-500">{monthLabel}</p>
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg hover:bg-slate-200"
            >
              ✕
            </button>
          </div>

          {/* Preview */}
          <div className="p-6">
            <div
              ref={collageRef}
              className="rounded-3xl border border-slate-200 bg-white p-4"
            >
              <CollagePreview glimpses={glimpses} />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-6">
            <button
              onClick={downloadCollage}
              disabled={downloading}
              className="w-full rounded-xl bg-violet-600 py-3 text-base font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {downloading ? "Generating..." : "📥 Download Collage"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}