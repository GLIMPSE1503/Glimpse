"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/components/ToastProvider";

type Props = {
  shareUrl: string;
  imageUrl: string;
  title?: string;
  variant?: "light" | "dark";
};

export default function ShareMenu({ shareUrl, imageUrl, title, variant = "light" }: Props) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

 async function handleShare() {
  setOpen(false);

  if (typeof window !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: title || "A memory on Glimpse",
        url: shareUrl,
      });
      return;
    } catch {
      // User cancelled sharing
    }
  }

  if (typeof window !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(shareUrl);
    toast.showToast("Link copied to clipboard.", "success");
  }
}

  async function handleCopyLink() {
    setOpen(false);
    await navigator.clipboard.writeText(shareUrl);
    toast.showToast("Link copied to clipboard.", "success");
  }

  function handleDownload() {
    setOpen(false);
  }

  const triggerClasses =
    variant === "dark"
      ? "rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
      : "rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Share options"
        className={`transition ${triggerClasses}`}
      >
        ⋯
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 text-slate-700 shadow-xl"
          >
            <button
              type="button"
              onClick={handleShare}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-violet-50"
            >
              📤 Share
            </button>
            <button
  type="button"
  onClick={handleCopyLink}
  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-violet-50"
>
  🔗 Copy Link
</button>

<a
  href={imageUrl}
  download
  target="_blank"
  rel="noreferrer"
  onClick={handleDownload}
  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-violet-50"
>
  ⬇️ Download
</a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}