"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import FollowButton from "@/components/profile/FollowButton";
import { ProfileRow } from "@/lib/supabase/types";

export default function DiscoverUsers({ currentUserId }: { currentUserId: string | null }) {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDiscover() {
      setLoading(true);
      const supabase = createClient();

      let followingIds: string[] = [];
      if (currentUserId) {
        const { data: followsData } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", currentUserId);
        followingIds = (followsData ?? []).map((f) => f.following_id);
      }

      const excludeIds = currentUserId ? [currentUserId, ...followingIds] : followingIds;

      let query = supabase
        .from("profiles")
        .select("id, full_name, bio, avatar_url, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(12);

      if (excludeIds.length > 0) {
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
      }

      const { data, error } = await query;
      if (error) console.error(error);
      setUsers(data ?? []);
      setLoading(false);
    }

    loadDiscover();
  }, [currentUserId]);

  if (!loading && users.length === 0) return null;

  return (
    <div className="rounded-[28px] border border-white/90 bg-white/90 p-6 shadow-lg shadow-slate-200/40 backdrop-blur-xl">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Discover People</h2>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 w-36 shrink-0 animate-pulse rounded-3xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-1">
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
              className="flex w-36 shrink-0 flex-col items-center gap-2 rounded-3xl border border-slate-100 bg-white p-4 text-center shadow-sm"
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
              </Link>

              <FollowButton
                currentUserId={currentUserId}
                targetUserId={user.id}
                initialIsFollowing={false}
                size="sm"
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}