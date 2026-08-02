"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import CollectionCard from "@/components/vault/CollectionCard";
import CreateCollectionModal from "@/components/vault/CreateCollectionModal";
import { CollectionStatsRow, GlimpseRow } from "@/lib/supabase/types";

type VaultTab = "timeline" | "collections" | "archive" | "favorites";
type TimelineGrouping = "month" | "year";

function groupKeyFor(dateString: string, grouping: TimelineGrouping) {
  const date = new Date(dateString);
  if (grouping === "year") {
    return String(date.getFullYear());
  }
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

export default function VaultPage() {
  const toast = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [collections, setCollections] = useState<CollectionStatsRow[]>([]);
  const [allGlimpses, setAllGlimpses] = useState<GlimpseRow[]>([]);
  const [archivedGlimpses, setArchivedGlimpses] = useState<GlimpseRow[]>([]);
  const [favoriteGlimpses, setFavoriteGlimpses] = useState<GlimpseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<VaultTab>("timeline");
  const [timelineGrouping, setTimelineGrouping] = useState<TimelineGrouping>("month");
  const [vaultSearch, setVaultSearch] = useState("");
 

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

    const [
      { data: collectionsData, error: collectionsError },
      { data: allData, error: allError },
      { data: archivedData, error: archivedError },
      { data: favoritesData, error: favoritesError },
    ] = await Promise.all([
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
    is_archived,
    archived_at,
    is_pinned
  `)
  .eq("user_id", userId)
  .order("created_at", { ascending: false }),
    supabase
  .from("glimpses")
  .select(`
    id,
    user_id,
    image_url,
    caption,
    created_at,
    expires_at,
    is_archived,
    archived_at,
    is_pinned
  `)
  .eq("user_id", userId)
  .eq("is_archived", true)
  .order("created_at", { ascending: false }),
      supabase.from("favorites").select("glimpse_id").eq("user_id", userId),
    ]);

    if (collectionsError) console.error(collectionsError);
    if (allError) {
      console.error(allError);
      toast.showToast("Could not load your memories.", "error");
    }
    if (archivedError) console.error(archivedError);
    if (favoritesError) console.error(favoritesError);

    const allRows = allData ?? [];
    setCollections((collectionsData as CollectionStatsRow[]) ?? []);
    setAllGlimpses(allRows);
    setArchivedGlimpses(archivedData ?? []);

    const favoriteIds = new Set((favoritesData ?? []).map((f) => f.glimpse_id));
    setFavoriteGlimpses(allRows.filter((g) => favoriteIds.has(g.id)));

    setLoading(false);
  }

  useEffect(() => {
    loadVault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const timelineGroups = useMemo(() => {
    const searchTerm = vaultSearch.trim().toLowerCase();
    const filtered = searchTerm
      ? allGlimpses.filter((g) => (g.caption || "").toLowerCase().includes(searchTerm))
      : allGlimpses;

    const groups = new Map<string, GlimpseRow[]>();
    filtered.forEach((glimpse) => {
      const key = groupKeyFor(glimpse.created_at, timelineGrouping);
      groups.set(key, [...(groups.get(key) ?? []), glimpse]);
    });

    return Array.from(groups.entries());
  }, [allGlimpses, vaultSearch, timelineGrouping]);

  const filteredArchive = useMemo(() => {
    const searchTerm = vaultSearch.trim().toLowerCase();
    if (!searchTerm) return archivedGlimpses;
    return archivedGlimpses.filter((g) => (g.caption || "").toLowerCase().includes(searchTerm));
  }, [archivedGlimpses, vaultSearch]);

  const filteredFavorites = useMemo(() => {
    const searchTerm = vaultSearch.trim().toLowerCase();
    if (!searchTerm) return favoriteGlimpses;
    return favoriteGlimpses.filter((g) => (g.caption || "").toLowerCase().includes(searchTerm));
  }, [favoriteGlimpses, vaultSearch]);

  const filteredCollections = useMemo(() => {
    const searchTerm = vaultSearch.trim().toLowerCase();
    if (!searchTerm) return collections;
    return collections.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm) ||
        (c.description || "").toLowerCase().includes(searchTerm)
    );
  }, [collections, vaultSearch]);

  if (!currentUserId && !loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <span className="text-4xl">🔒</span>
        <p className="mt-4 text-lg font-medium text-slate-600">Sign in to view your Memory Vault.</p>
      </div>
    );
  }

  const tabs: { key: VaultTab; label: string }[] = [
    { key: "timeline", label: "Timeline" },
    { key: "collections", label: "Collections" },
    { key: "archive", label: "Archive" },
    { key: "favorites", label: "Favorites" },
  ];

  function MemoryGrid({ items, emptyMessage, emptyIcon }: { items: GlimpseRow[]; emptyMessage: string; emptyIcon: string }) {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-14 text-center shadow-sm">
          <span className="text-4xl">{emptyIcon}</span>
          <p className="mt-4 text-base font-medium text-slate-600">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((glimpse, index) => (
          <motion.div
            key={glimpse.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3), ease: "easeOut" }}
            className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
          >
            <Link href={`/profile/${glimpse.user_id}`}>
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
            </Link>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Memory Vault</h1>
          <p className="mt-1 text-sm text-slate-500">Every memory, organized your way.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-purple-500 px-5 py-3 text-sm font-medium text-white shadow-sm shadow-purple-200 transition hover:bg-purple-600 sm:self-auto"
        >
          + New Collection
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap gap-1 rounded-full bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                activeTab === tab.key ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            value={vaultSearch}
            onChange={(e) => setVaultSearch(e.target.value)}
            placeholder="Search your vault..."
            className="w-full rounded-full border border-slate-200 bg-white/90 py-2.5 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] w-full animate-pulse rounded-[28px] bg-slate-200" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "timeline" && (
              <div>
                <div className="mb-4 inline-flex rounded-full bg-slate-100 p-1">
                  {(["month", "year"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTimelineGrouping(mode)}
                      className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                        timelineGrouping === mode
                          ? "bg-white text-purple-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      By {mode === "month" ? "Month" : "Year"}
                    </button>
                  ))}
                </div>

                {timelineGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-14 text-center shadow-sm">
                    <span className="text-4xl">🕰️</span>
                    <p className="mt-4 text-base font-medium text-slate-600">No memories found.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {timelineGroups.map(([groupLabel, items]) => (
                      <div key={groupLabel}>
                        <h2 className="mb-3 text-sm font-semibold text-slate-900">
                          {groupLabel} <span className="font-normal text-slate-400">· {items.length}</span>
                        </h2>
                        <MemoryGrid items={items} emptyMessage="" emptyIcon="" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "collections" &&
              (filteredCollections.length === 0 ? (
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
                  {filteredCollections.map((collection, index) => (
                    <CollectionCard key={collection.id} collection={collection} index={index} />
                  ))}
                </div>
              ))}

            {activeTab === "archive" && (
              <MemoryGrid
                items={filteredArchive}
                emptyMessage="Nothing archived yet. Memories you archive before they expire will show up here."
                emptyIcon="⏳"
              />
            )}

            {activeTab === "favorites" && (
              <MemoryGrid
                items={filteredFavorites}
                emptyMessage="You haven't favorited any memories yet."
                emptyIcon="⭐"
              />
            )}
          </motion.div>
        </AnimatePresence>
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