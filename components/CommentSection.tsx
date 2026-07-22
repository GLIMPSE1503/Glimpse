"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CommentRow } from "@/lib/supabase/types";
import CommentBubble from "@/components/CommentBubble";

interface CommentSectionProps {
  comments: CommentRow[];
  draft: string;
  disabled: boolean;
  currentUserId?: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CommentSection({
  comments,
  draft,
  disabled,
  currentUserId,
  onDraftChange,
  onSubmit,
  onDelete,
}: CommentSectionProps) {
  return (
    <div className="mt-5 rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span className="font-semibold">💬 Comments</span>
      </div>

      <div className="mt-4 space-y-4">
        {comments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
           💭 No comments yet. Start the conversation.
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <CommentBubble
                    comment={comment}
                    isOwn={currentUserId === comment.user_id}
                    onDelete={onDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <textarea
          placeholder={currentUserId ? "Write a comment..." : "Sign in to leave a comment..."}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          disabled={disabled || !currentUserId}
          className="min-h-[110px] w-full rounded-[28px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 sm:max-w-[72%]"
        />

        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !currentUserId || draft.trim().length === 0}
          className="inline-flex h-12 items-center justify-center rounded-3xl bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-400 px-6 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Post
        </button>
      </div>
    </div>
  );
}
