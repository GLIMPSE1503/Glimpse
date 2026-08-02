"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ToastProvider";
import { useFollow } from "@/hooks/useFollow";
import type { FollowStatus } from "@/lib/supabase/types";

type Props = {
  currentUserId: string | null;
  targetUserId: string;
  targetIsPrivate: boolean;
  initialStatus: FollowStatus;
  onChange?: (status: FollowStatus) => void;
  size?: "sm" | "md";
};

export default function FollowButton({
  currentUserId,
  targetUserId,
  targetIsPrivate,
  initialStatus,
  onChange,
  size = "md",
}: Props) {
  const toast = useToast();
  const { status, loading, toggleFollow } = useFollow({
    currentUserId,
    targetUserId,
    targetIsPrivate,
    initialStatus,
    onStatusChange: onChange,
  });

  const isSelf = currentUserId === targetUserId;

  async function handleClick() {
    const previousStatus = status;
    const result = await toggleFollow();

    if (result.success) {
      if (previousStatus === "following") {
        toast.showToast("Unfollowed.", "success");
      } else if (previousStatus === "none") {
        toast.showToast("You are now following this user.", "success");
      }
      return;
    }

    if (result.errorMessage) {
      toast.showToast(result.errorMessage, "info");
    }
  }

  if (isSelf) return null;

  const padding = size === "sm" ? "px-4 py-1.5 text-xs" : "px-5 py-2 text-sm";

  const labelFor = (s: FollowStatus) => (s === "following" ? "Following" : s === "requested" ? "Requested" : "Follow");

  const stylesFor = (s: FollowStatus) => {
    if (s === "following") {
      return "border border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600";
    }
    if (s === "requested") {
      return "border border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200";
    }
    return "bg-purple-500 text-white shadow-purple-200 hover:bg-purple-600";
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={loading}
      whileTap={{ scale: 0.94 }}
      className={`relative overflow-hidden rounded-full font-medium shadow-sm transition ${padding} ${stylesFor(
        status
      )} disabled:opacity-60`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="inline-block"
        >
          {labelFor(status)}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}