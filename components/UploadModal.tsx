"use client";

import { AnimatePresence, motion } from "framer-motion";

interface UploadModalProps {
  isOpen?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function UploadModal({ isOpen = true, onClose, children }: UploadModalProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/20 bg-white/95 shadow-2xl shadow-slate-900/10"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm transition hover:bg-slate-100"
              aria-label="Close upload modal"
            >
              ✕
            </button>
            <div className="p-6 pb-8">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
