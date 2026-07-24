"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import FollowButton from "@/components/profile/FollowButton";
import { ProfileStatsRow, GlimpseStatsRow } from "@/lib/supabase/types";

export default function DiscoverPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<ProfileStatsRow[]>([]);
  const [recentlyJoined, setRecentlyJoined] = useState<ProfileStatsRow[]>([]);
  const [popular, setPopular] = useState<ProfileStatsRow[]>([]);
  const [trending, setTrending] = useState<GlimpseStatsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;
      setCurrentUserId(userId);

      let followingIds: string[] = [];
      if (userId) {
        const { data: followsData } = await supabase
          .from("followers")
          .select("following_id")
          .eq("follower_id", userId);
        followingIds = (followsData ?? []).map((f) => f.following_id);
      }

      const excludeIds = userId ? [userId, ...followingIds] : followingIds;
      const excludeFilter = excludeIds.length > 0 ? `(${excludeIds.join(",")})` : null;

      let suggestedQuery = supabase.from("profile_stats").select("*").order("created_at", { ascending: false }).limit(8);
      if (excludeFilter) suggestedQuery = suggestedQuery.not("id", "in", excludeFilter);

      let recentQuery = supabase.from("profile_stats").select("*").order("created_at", { ascending: false }).limit(6);

      let popularQuery = supabase
        .from("profile_stats")
        .select("*")
        .order("followers_count", { ascending: false })
        .limit(6);
      if (excludeFilter) popularQuery = popularQuery.not("id", "in", excludeFilter);

      const trendingQuery = supabase
        .from("glimpse_stats")
        .select("*")
        .order("like_count", { ascending: false })
        .limit(6);

      const [suggestedRes, recentRes, popularRes, trendingRes] = await Promise.all([
        suggestedQuery,
        recentQuery,
        popularQuery,
        trendingQuery,
      ]);

      if (suggestedRes.error) console.error(suggestedRes.error);
      if (recentRes.error) console.error(recentRes.error);
      if (popularRes.error) console.error(popularRes.error);
      if (trendingRes.error) console.error(trendingRes.error);

      setSuggested((suggestedRes.data as ProfileStatsRow[]) ?? []);
      setRecentlyJoined((recentRes.data as ProfileStatsRow[]) ?? []);
      setPopular((popularRes.data as ProfileStatsRow[]) ?? []);
      setTrending((trendingRes.data as GlimpseStatsRow[]) ?? []);
      setLoading(false);
    }

    load();
  }, []);

  function UserCard({ user, index }: { user: ProfileStatsRow; index: number }) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
        whileHover={{ y: -4 }}
        className="flex w-40 shrink-0 flex-col items-center gap-2 rounded-3xl border border-slate-100 bg-white p-4 text-center shadow-sm"
      >
        <Link href={`/profile/${user.id}`} className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-sm">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name ?? "User"} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-400">
                {(user.full_name || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p className="line-clamp-1 text-sm font-medium text-slate-900">{user.full_name || "Glimpse User"}</p>
          {user.bio && <p className="line-clamp-2 text-xs text-slate-500">{user.bio}</p>}
          <p className="text-xs text-slate-400">{user.followers_count} followers</p>
        </Link>
        <FollowButton currentUserId={currentUserId} targetUserId={user.id} initialIsFollowing={false} size="sm" />
      </motion.div>
    );
  }

  function Section({
    title,
    children,
    empty,
  }: {
    title: string;
    children: React.ReactNode;
    empty: boolean;
  }) {
    return (
      <div className="rounded-[28px] border border-white/90 bg-white/90 p-6 shadow-lg shadow-slate-200/40 backdrop-blur-xl">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
        {empty ? (
          <p className="text-sm text-slate-400">Nothing here yet.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-1">{children}</div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Discover</h1>
        <p className="mt-1 text-sm text-slate-500">Find new people and trending memories on Glimpse.</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-[28px] bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          <Section title="Suggested for You" empty={suggested.length === 0}>
            {suggested.map((user, index) => (
              <UserCard key={user.id} user={user} index={index} />
            ))}
          </Section>

          <Section title="Popular Creators" empty={popular.length === 0}>
            {popular.map((user, index) => (
              <UserCard key={user.id} user={user} index={index} />
            ))}
          </Section>

          <Section title="Recently Joined" empty={recentlyJoined.length === 0}>
            {recentlyJoined.map((user, index) => (
              <UserCard key={user.id} user={user} index={index} />
            ))}
          </Section>

          <div className="rounded-[28px] border border-white/90 bg-white/90 p-6 shadow-lg shadow-slate-200/40 backdrop-blur-xl">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Trending Memories</h2>
            {trending.length === 0 ? (
              <p className="text-sm text-slate-400">No trending memories yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {trending.map((glimpse, index) => (
                  <motion.div
                    key={glimpse.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                    whileHover={{ y: -4 }}
                    className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
                  >
                    <Link href={`/profile/${glimpse.user_id}`}>
                      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                        <img
                          src={glimpse.image_url}
                          alt={glimpse.caption ?? "Trending memory"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-1 text-sm font-medium text-slate-900">
                          {glimpse.caption || "Untitled Memory ✨"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          ❤️ {glimpse.like_count} · 💬 {glimpse.comment_count}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}