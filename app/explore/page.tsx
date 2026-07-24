"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { GlimpseStatsRow } from "@/lib/supabase/types";

type SortMode = "trending" | "newest" | "mostLiked" | "random";

export default function ExplorePage() {
  const [posts, setPosts] = useState<GlimpseStatsRow[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("trending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      const supabase = createClient();

      let query = supabase.from("glimpse_stats").select("*").limit(60);

      if (sortMode === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sortMode === "mostLiked" || sortMode === "trending") {
        query = query.order("like_count", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      let rows = (data as GlimpseStatsRow[]) ?? [];
      if (sortMode === "random") {
        rows = [...rows].sort(() => Math.random() - 0.5);
      }

      setPosts(rows);
      setLoading(false);
    }

    loadPosts();
  }, [sortMode]);

  const sortOptions: { key: SortMode; label: string }[] = [
    { key: "trending", label: "Trending" },
    { key: "mostLiked", label: "Most Liked" },
    { key: "newest", label: "Newest" },
    { key: "random", label: "Shuffle" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Explore</h1>
        <div className="inline-flex flex-wrap gap-1 rounded-full bg-slate-100 p-1">
          {sortOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSortMode(option.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                sortMode === option.key
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="break-inside-avoid animate-pulse rounded-3xl bg-slate-200"
              style={{ height: `${180 + (i % 3) * 60}px` }}
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-20 text-center shadow-sm">
          <span className="text-4xl">🖼️</span>
          <p className="mt-4 text-lg font-medium text-slate-600">Nothing to explore yet ✨</p>
        </div>
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.4), ease: "easeOut" }}
              className="break-inside-avoid overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
            >
              <Link href={`/profile/${post.user_id}`}>
                <img
                  src={post.image_url}
                  alt={post.caption ?? "Memory"}
                  className="w-full object-cover"
                  loading="lazy"
                />
                <div className="p-3">
                  <p className="line-clamp-2 text-sm text-slate-700">
                    {post.caption || "Untitled Memory ✨"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    ❤️ {post.like_count} · 💬 {post.comment_count}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}