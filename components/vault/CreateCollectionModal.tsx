"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { CollectionStatsRow } from "@/lib/supabase/types";

type Props = {
  currentUserId: string;
  onClose: () => void;
  onCreated: (collection: CollectionStatsRow) => void;
};

const EMOJI_OPTIONS = ["📁", "✈️", "🍜", "👨‍👩‍👧‍👦", "🎉", "🏠", "🐾", "💪", "🎨", "🌙"];

export default function CreateCollectionModal({ currentUserId, onClose, onCreated }: Props) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.showToast("Give your collection a name.", "info");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("collections")
      .insert({
        user_id: currentUserId,
        name: trimmedName,
        description: description.trim() || null,
        emoji,
        is_private: isPrivate,
      })
      .select("id, user_id, name, description, emoji, is_private, created_at, updated_at")
      .single();

    setSaving(false);

    if (error) {
      console.error(error);
      toast.showToast("Could not create collection.", "error");
      return;
    }

    toast.showToast("Collection created ✨", "success");
    onCreated({ ...data, cover_image_url: null, item_count: 0 } as CollectionStatsRow);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl"
        >
          <h2 className="text-lg font-semibold text-slate-900">New Collection</h2>

          <div className="mt-4">
            <label className="mb-2 block text-xs font-medium text-slate-500">Choose an icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setEmoji(option)}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg transition ${
                    emoji === option ? "bg-purple-100 ring-2 ring-purple-400" : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Travel, Food, Friends"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What's this collection for?"
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-purple-500 focus:ring-purple-300"
              />
              Keep this collection private
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="rounded-full bg-purple-500 px-5 py-2 text-sm font-medium text-white shadow-sm shadow-purple-200 hover:bg-purple-600 disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}