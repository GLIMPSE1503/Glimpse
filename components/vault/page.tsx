"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import CollectionCard from "@/components/vault/CollectionCard";
import CreateCollectionModal from "@/components/vault/CreateCollectionModal";
import { CollectionStatsRow, GlimpseRow } from "@/lib/supabase/types";

export default function VaultPage() {
  const toast = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [collections, setCollections] = useState<CollectionStatsRow[]>([]);
  const [archivedGlimpses, setArchivedGlimpses] = useState<GlimpseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function loadVault() {
    setLoading(true);
    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;
    setCurrentUserId(userId);

    if (!userId) {
      setLoading(false);
      return;
    }

    const [{ data: collectionsData, error: collectionsError }, { data: archivedData, error: archivedError }] =
      await Promise.all([
        supabase
          .from("collection_stats")
          .select("*")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false }),
        supabase
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
          .eq("user_id", userId)
          .eq("is_archived", true)
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

    if (collectionsError) {
      console.error(collectionsError);
      toast.showToast("Could not load your collections.", "error");
    }
    if (archivedError) console.error(archivedError);

    setCollections((collectionsData as CollectionStatsRow[]) ?? []);
    setArchivedGlimpses(archivedData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadVault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!currentUserId && !loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <span className="text-4xl">🔒</span>
        <p className="mt-4 text-lg font-medium text-slate-600">Sign in to view your Memory Vault.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Memory Vault</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your collections and memories that made it past their 24 hours.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-purple-500 px-5 py-3 text-sm font-medium text-white shadow-sm shadow-purple-200 transition hover:bg-purple-600 sm:self-auto"
        >
          + New Collection
        </button>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] w-full animate-pulse rounded-[28px] bg-slate-200" />
          ))}
        </div>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Your Collections</h2>
            {collections.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-14 text-center shadow-sm">
                <span className="text-4xl">📁</span>
                <p className="mt-4 text-base font-medium text-slate-600">
                  No collections yet. Group your favorite memories into Travel, Food, Friends and more.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-4 rounded-full bg-purple-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-purple-200 hover:bg-purple-600"
                >
                  Create your first collection
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection, index) => (
                  <CollectionCard key={collection.id} collection={collection} index={index} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Archived Memories</h2>
              <span className="text-xs text-slate-400">Saved before they expired</span>
            </div>

            {archivedGlimpses.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-14 text-center shadow-sm">
                <span className="text-4xl">⏳</span>
                <p className="mt-4 text-base font-medium text-slate-600">
                  Nothing archived yet. Memories you archive before they expire will show up here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {archivedGlimpses.map((glimpse, index) => (
                  <motion.div
                    key={glimpse.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3), ease: "easeOut" }}
                    className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
                  >
                    <Link href={`/profile/${glimpse.user_id}`}>
                      <div className="aspect-square w-full overflow-hidden bg-slate-100">
                        <img
                          src={glimpse.image_url}
                          alt={glimpse.caption ?? "Archived memory"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <p className="line-clamp-1 p-2 text-xs text-slate-600">
                        {glimpse.caption || "Untitled Memory ✨"}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {isCreateOpen && currentUserId && (
        <CreateCollectionModal
          currentUserId={currentUserId}
          onClose={() => setIsCreateOpen(false)}
          onCreated={(newCollection) => {
            setCollections((current) => [newCollection, ...current]);
            setIsCreateOpen(false);
          }}
        />
      )}
    </div>
  );
}