"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import FollowListItem from "@/components/follow/FollowListItem";
import type { ProfileRow, FollowStatus } from "@/lib/supabase/types";



export default function FollowingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [targetProfile, setTargetProfile] = useState<ProfileRow | null>(null);
  const [following, setFollowing] = useState<ProfileRow[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, FollowStatus>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const targetUserId = searchParams.get("user");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const viewerId = userData?.user?.id ?? null;

      if (!viewerId) {
        setCheckingAuth(false);
        router.push("/");
        return;
      }

      setCurrentUserId(viewerId);
      setCheckingAuth(false);

      const resolvedTargetId = targetUserId || viewerId;
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, full_name, bio, avatar_url, cover_url, is_private, notify_likes, notify_comments, notify_follows, auto_archive_enabled, language, created_at, updated_at"
        )
        .eq("id", resolvedTargetId)
        .maybeSingle();

      if (profileError) console.error(profileError);
      setTargetProfile((profileData as ProfileRow) ?? null);

      const isOwner = resolvedTargetId === viewerId;
      if (profileData?.is_private && !isOwner) {
        const { data: followCheck } = await supabase
          .from("followers")
          .select("follower_id")
          .eq("follower_id", viewerId)
          .eq("following_id", resolvedTargetId)
          .maybeSingle();

        if (!followCheck) {
          setFollowing([]);
          setLoading(false);
          return;
        }
      }

      const { data: followingRows, error: followingError } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", resolvedTargetId)
        .order("created_at", { ascending: false });

      if (followingError) {
        console.error(followingError);
        toast.showToast("Could not load following list.", "error");
        setLoading(false);
        return;
      }

      const followingIds = (followingRows ?? []).map((r) => r.following_id);

      if (followingIds.length === 0) {
        setFollowing([]);
        setLoading(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(
          "id, full_name, bio, avatar_url, cover_url, is_private, notify_likes, notify_comments, notify_follows, auto_archive_enabled, language, created_at, updated_at"
        )
        .in("id", followingIds);

      if (profilesError) {
        console.error(profilesError);
        toast.showToast("Could not load profiles.", "error");
        setLoading(false);
        return;
      }

      const [{ data: myFollowingRows }, { data: myPendingRows }] = await Promise.all([
        supabase.from("followers").select("following_id").eq("follower_id", viewerId),
        supabase.from("follow_requests").select("target_id").eq("requester_id", viewerId).eq("status", "pending"),
      ]);

      const followingSet = new Set((myFollowingRows ?? []).map((r) => r.following_id));
      const pendingSet = new Set((myPendingRows ?? []).map((r) => r.target_id));

      const nextStatusMap: Record<string, FollowStatus> = {};
      (profilesData ?? []).forEach((p) => {
        if (followingSet.has(p.id)) nextStatusMap[p.id] = "following";
        else if (pendingSet.has(p.id)) nextStatusMap[p.id] = "requested";
        else nextStatusMap[p.id] = "none";
      });

      setStatusMap(nextStatusMap);
      setFollowing((profilesData as ProfileRow[]) ?? []);
      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  function handleFollowChange(userId: string, status: FollowStatus) {
    setStatusMap((current) => ({ ...current, [userId]: status }));

    // If this is the viewer's own following list and they just unfollowed
    // someone, drop that person from the visible list immediately.
    const isOwnList = currentUserId !== null && (targetUserId || currentUserId) === currentUserId;
    if (isOwnList && status === "none") {
      setFollowing((current) => current.filter((f) => f.id !== userId));
    }
  }

  const filteredFollowing = following.filter((f) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (f.full_name || "").toLowerCase().includes(term) || (f.bio || "").toLowerCase().includes(term);
  });

  const isOwner = currentUserId !== null && currentUserId === (targetUserId || currentUserId);

  if (checkingAuth) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">
        {isOwner ? "Following" : `${targetProfile?.full_name || "User"} is Following`}
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        {following.length} {following.length === 1 ? "person" : "people"}
      </p>

      <div className="relative mb-6">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search following..."
          className="w-full rounded-full border border-slate-200 bg-white/90 py-2.5 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : filteredFollowing.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white/70 px-8 py-16 text-center shadow-sm">
          <span className="text-4xl">🧭</span>
          <p className="mt-4 text-base font-medium text-slate-600">
            {searchTerm.trim() ? "No one matches your search." : "Not following anyone yet."}
          </p>
        </div>
      ) : (
        <motion.div layout className="space-y-2">
          {filteredFollowing.map((person, index) => (
            <FollowListItem
              key={person.id}
              profile={person}
              currentUserId={currentUserId}
              index={index}
              followStatus={statusMap[person.id] ?? "none"}
              showRemoveButton={false}
              onFollowChange={handleFollowChange}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}