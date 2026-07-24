"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { CollectionRow } from "@/lib/supabase/types";

type Props = {
  glimpseId: string;
  currentUserId: string;
  onClose: () => void;
};

export default function SaveToCollectionModal({ glimpseId, currentUserId, onClose }: Props) {
  const toast = useToast();
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadCollections() {
    setLoading(true);
    const supabase = createClient();

    const { data: collectionsData, error: collectionsError } = await supabase
      .from("collections")
      .select("id, user_id, name, created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: true });

    if (collectionsError) {
      console.error(collectionsError);
      toast.showToast("Could not load your collections.", "error");
      setLoading(false);
      return;
    }

    const rows = collectionsData ?? [];
    setCollections(rows);

    if (rows.length > 0) {
      const { data: itemsData } = await supabase
        .from("collection_items")
        .select("collection_id")
        .eq("glimpse_id", glimpseId)
        .in("collection_id", rows.map((c) => c.id));

      setMemberIds(new Set((itemsData ?? []).map((i) => i.collection_id)));
    }

    setLoading(false);
  }

  useEffect(() => {
    loadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleCollection(collectionId: string) {
    const supabase = createClient();
    const isMember = memberIds.has(collectionId);

    setMemberIds((current) => {
      const next = new Set(current);
      if (isMember) next.delete(collectionId);
      else next.add(collectionId);
      return next;
    });

    if (isMember) {
      const { error } = await supabase
        .from("collection_items")
        .delete()
        .eq("collection_id", collectionId)
        .eq("glimpse_id", glimpseId);

      if (error) {
        console.error(error);
        setMemberIds((current) => new Set(current).add(collectionId));
        toast.showToast("Could not remove from collection.", "error");
      }
    } else {
      const { error } = await supabase
        .from("collection_items")
        .insert({ collection_id: collectionId, glimpse_id: glimpseId });

      if (error) {
        console.error(error);
        setMemberIds((current) => {
          const next = new Set(current);
          next.delete(collectionId);
          return next;
        });
        toast.showToast("Could not add to collection.", "error");
      }
    }
  }

  async function createCollection() {
    const name = newCollectionName.trim();
    if (!name) return;
    setCreating(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("collections")
      .insert({ user_id: currentUserId, name })
      .select("id, user_id, name, created_at")
      .single();

    setCreating(false);

    if (error) {
      console.error(error);
      toast.showToast("Could not create collection.", "error");
      return;
    }

    setCollections((current) => [...current, data as CollectionRow]);
    setNewCollectionName("");
    toggleCollection((data as CollectionRow).id);
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
          <h2 className="text-lg font-semibold text-slate-900">Save to Collection</h2>

          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              ))
            ) : collections.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                No collections yet. Create your first one below.
              </p>
            ) : (
              collections.map((collection) => {
                const isMember = memberIds.has(collection.id);
                return (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => toggleCollection(collection.id)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-left transition hover:bg-violet-50"
                  >
                    <span className="text-sm font-medium text-slate-800">{collection.name}</span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                        isMember
                          ? "border-purple-500 bg-purple-500 text-white"
                          : "border-slate-300 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="New collection name..."
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
            />
            <button
              type="button"
              onClick={createCollection}
              disabled={creating || !newCollectionName.trim()}
              className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-purple-200 hover:bg-purple-600 disabled:opacity-60"
            >
              {creating ? "..." : "Create"}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-full bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
          >
            Done
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}