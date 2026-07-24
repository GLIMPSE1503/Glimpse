"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { CollectionStatsRow, GlimpseRow } from "@/lib/supabase/types";

export default function CollectionDetailPage() {
  const params = useParams<{ collectionId: string }>();
  const collectionId = params.collectionId;
  const router = useRouter();
  const toast = useToast();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [collection, setCollection] = useState<CollectionStatsRow | null>(null);
  const [items, setItems] = useState<{ collectionItemId: string; glimpse: GlimpseRow }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  async function loadCollection() {
    setLoading(true);
    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;
    setCurrentUserId(userId);

    const { data: collectionData, error: collectionError } = await supabase
      .from("collection_stats")
      .select("*")
      .eq("id", collectionId)
      .maybeSingle();

    if (collectionError) {
      console.error(collectionError);
      toast.showToast("Could not load this collection.", "error");
      setLoading(false);
      return;
    }

    if (!collectionData || (userId && collectionData.user_id !== userId)) {
      setCollection(null);
      setLoading(false);
      return;
    }

    setCollection(collectionData as CollectionStatsRow);
    setNameDraft(collectionData.name);

    const { data: itemsData, error: itemsError } = await supabase
      .from("collection_items")
      .select("id, glimpse_id, created_at")
      .eq("collection_id", collectionId)
      .order("created_at", { ascending: false });

    if (itemsError) {
      console.error(itemsError);
      setLoading(false);
      return;
    }

    const glimpseIds = (itemsData ?? []).map((i) => i.glimpse_id);
    if (glimpseIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data: glimpsesData, error: glimpsesError } = await supabase
      .from("glimpses")
        .select(`
    id,
    user_id,
    image_url,
    caption,
    created_at,
    expires_at,
    is_archived
  `)
      .in("id", glimpseIds);

    if (glimpsesError) {
      console.error(glimpsesError);
      setLoading(false);
      return;
    }

    const glimpseMap = (glimpsesData ?? []).reduce((acc, g) => {
      acc[g.id] = g;
      return acc;
    }, {} as Record<string, GlimpseRow>);

    const combined = (itemsData ?? [])
      .filter((i) => glimpseMap[i.glimpse_id])
      .map((i) => ({ collectionItemId: i.id, glimpse: glimpseMap[i.glimpse_id] }));

    setItems(combined);
    setLoading(false);
  }

  useEffect(() => {
    if (collectionId) loadCollection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

  async function removeItem(collectionItemId: string) {
    const previousItems = items;
    setItems((current) => current.filter((i) => i.collectionItemId !== collectionItemId));

    const supabase = createClient();
    const { error } = await supabase.from("collection_items").delete().eq("id", collectionItemId);

    if (error) {
      console.error(error);
      setItems(previousItems);
      toast.showToast("Could not remove memory from collection.", "error");
    }
  }

  async function saveName() {
    const trimmed = nameDraft.trim();
    if (!collection || !trimmed) return;

    const supabase = createClient();
    const { error } = await supabase.from("collections").update({ name: trimmed }).eq("id", collection.id);

    if (error) {
      console.error(error);
      toast.showToast("Could not rename collection.", "error");
      return;
    }

    setCollection((current) => (current ? { ...current, name: trimmed } : current));
    setIsEditingName(false);
    toast.showToast("Collection renamed.", "success");
  }

  async function deleteCollection() {
    if (!collection) return;
    const confirmed = window.confirm(`Delete "${collection.name}"? This won't delete the memories themselves.`);
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from("collections").delete().eq("id", collection.id);

    if (error) {
      console.error(error);
      toast.showToast("Could not delete collection.", "error");
      return;
    }

    toast.showToast("Collection deleted.", "success");
    router.push("/vault");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-10 w-1/3 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square w-full animate-pulse rounded-3xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <span className="text-4xl">🔍</span>
        <p className="mt-4 text-lg font-medium text-slate-600">This collection doesn't exist or isn't yours.</p>
        <Link href="/vault" className="mt-4 inline-block text-sm font-medium text-purple-500 hover:text-purple-600">
          ← Back to Vault
        </Link>
      </div>
    );
  }

  const isOwner = currentUserId === collection.user_id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/vault" className="mb-6 inline-block text-sm font-medium text-purple-500 hover:text-purple-600">
        ← Back to Vault
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="text-4xl">{collection.emoji}</span>
          <div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-lg font-semibold text-slate-900 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={saveName}
                  className="rounded-full bg-purple-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingName(false);
                    setNameDraft(collection.name);
                  }}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h1 className="text-2xl font-semibold text-slate-900">{collection.name}</h1>
            )}
            {collection.description && <p className="mt-1 text-sm text-slate-500">{collection.description}</p>}
            <p className="mt-1 text-xs text-slate-400">
              {items.length} {items.length === 1 ? "memory" : "memories"} · {collection.is_private ? "Private" : "Public"}
            </p>
          </div>
        </div>

        {isOwner && !isEditingName && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="rounded-full bg-purple-50 px-4 py-2 text-xs font-medium text-purple-600 hover:bg-purple-100"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={deleteCollection}
              className="rounded-full bg-red-50 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-100"
            >
              Delete Collection
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-16 text-center shadow-sm">
          <span className="text-4xl">{collection.emoji}</span>
          <p className="mt-4 text-base font-medium text-slate-600">
            No memories in this collection yet. Save memories here from the feed using the bookmark icon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map(({ collectionItemId, glimpse }, index) => (
            <motion.div
              key={collectionItemId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3), ease: "easeOut" }}
              className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
            >
              <div className="aspect-square w-full overflow-hidden bg-slate-100">
                <img
                  src={glimpse.image_url}
                  alt={glimpse.caption ?? "Memory"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="line-clamp-1 p-2 text-xs text-slate-600">
                {glimpse.caption || "Untitled Memory ✨"}
              </p>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => removeItem(collectionItemId)}
                  aria-label="Remove from collection"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                >
                  ✕
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}