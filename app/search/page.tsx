"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ProfileRow, GlimpseRow } from "@/lib/supabase/types";

const RECENT_SEARCHES_KEY = "glimpse_recent_searches";
const MAX_RECENT = 6;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [posts, setPosts] = useState<GlimpseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // ignore malformed storage
    }
  }, []);

  function saveRecentSearch(term: string) {
    setRecentSearches((current) => {
      const next = [term, ...current.filter((t) => t !== term)].slice(0, MAX_RECENT);
      try {
        window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // ignore storage failures (e.g. private browsing)
      }
      return next;
    });
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    try {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setUsers([]);
      setPosts([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();

      const [usersRes, postsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, bio, avatar_url, cover_url, created_at, updated_at")
          .ilike("full_name", `%${term}%`)
          .limit(10),
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
          .ilike("caption", `%${term}%`)
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

      if (usersRes.error) console.error(usersRes.error);
      if (postsRes.error) console.error(postsRes.error);

      setUsers(usersRes.data ?? []);
      setPosts(postsRes.data ?? []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function handleSubmitSearch() {
    const term = query.trim();
    if (term) saveRecentSearch(term);
  }

  const hasResults = users.length > 0 || posts.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Search</h1>

      <div className="relative mb-8">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmitSearch()}
          onBlur={handleSubmitSearch}
          placeholder="Search people or captions..."
          className="w-full rounded-full border border-slate-200 bg-white/90 py-3.5 pl-11 pr-4 text-sm text-slate-700 shadow-sm shadow-slate-200/60 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          autoFocus
        />
      </div>

      {!query.trim() && recentSearches.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Searches</h2>
            <button
              type="button"
              onClick={clearRecentSearches}
              className="text-xs font-medium text-purple-500 hover:text-purple-600"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 hover:bg-slate-200"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : query.trim() && !hasResults ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-16 text-center shadow-sm">
          <span className="text-4xl">🔎</span>
          <p className="mt-4 text-lg font-medium text-slate-600">No results for "{query}"</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={query}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {users.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-slate-900">People</h2>
                <div className="space-y-2">
                  {users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.id}`}
                      onClick={handleSubmitSearch}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition hover:bg-violet-50"
                    >
                      <img
                        src={user.avatar_url || "/placeholder-avatar.png"}
                        alt={user.full_name ?? "User"}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {user.full_name || "Glimpse User"}
                        </p>
                        {user.bio && <p className="line-clamp-1 text-xs text-slate-500">{user.bio}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {posts.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Memories</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/profile/${post.user_id}`}
                      onClick={handleSubmitSearch}
                      className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-slate-100">
                        <img
                          src={post.image_url}
                          alt={post.caption ?? "Memory"}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <p className="line-clamp-1 p-2 text-xs text-slate-600">
                        {post.caption || "Untitled Memory ✨"}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}