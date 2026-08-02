"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { useInfiniteScroll } from "@/components/shared/useInfiniteScroll";
import FollowListItem from "@/components/follow/FollowListItem";
import { resolveFollowStatuses, removeFollower } from "@/lib/follow";
import { ProfileRow, FollowStatus } from "@/lib/supabase/types";

const PAGE_SIZE = 12;

export default function FollowersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [targetProfile, setTargetProfile] = useState<ProfileRow | null>(null);
  const [followers, setFollowers] = useState<ProfileRow[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, FollowStatus>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [resolvedTargetId, setResolvedTargetId] = useState<string | null>(null);
  const [gated, setGated] = useState(false);

  const targetUserId = searchParams.get("user");

  useEffect(() => {
    async function init() {
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

      const targetId = targetUserId || viewerId;
      setResolvedTargetId(targetId);
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetId)
        .maybeSingle();

      if (profileError) console.error(profileError);
      setTargetProfile((profileData as ProfileRow) ?? null);

      const isOwner = targetId === viewerId;
      if (profileData?.is_private && !isOwner) {
        const { data: followCheck } = await supabase
          .from("followers")
          .select("follower_id")
          .eq("follower_id", viewerId)
          .eq("following_id", targetId)
          .maybeSingle();

        if (!followCheck) {
          setGated(true);
          setLoading(false);
          return;
        }
      }

      await loadPage(targetId, viewerId, 0, false);
    }

    async function loadPage(targetId: string, viewerId: string, pageIndex: number, append: boolean) {
      const supabase = createClient();
      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: followerRows, error: followerError } = await supabase
        .from("followers")
        .select("follower_id")
        .eq("following_id", targetId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (followerError) {
        console.error(followerError);
        toast.showToast("Could not load followers.", "error");
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const followerIds = (followerRows ?? []).map((r) => r.follower_id);

      if (followerIds.length === 0) {
        if (!append) setFollowers([]);
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", followerIds);

      if (profilesError) {
        console.error(profilesError);
        toast.showToast("Could not load follower profiles.", "error");
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const newProfiles = (profilesData as ProfileRow[]) ?? [];
      const statuses = await resolveFollowStatuses(supabase, viewerId, newProfiles.map((p) => p.id));

      setStatusMap((current) => ({ ...current, ...statuses }));
      setFollowers((current) => (append ? [...current, ...newProfiles] : newProfiles));
      setHasMore(followerIds.length === PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  async function loadMore() {
    if (loadingMore || !hasMore || !resolvedTargetId || !currentUserId) return;
    setLoadingMore(true);

    const supabase = createClient();
    const nextPage = page + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: followerRows, error } = await supabase
      .from("followers")
      .select("follower_id")
      .eq("following_id", resolvedTargetId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error(error);
      toast.showToast("Could not load more followers.", "error");
      setLoadingMore(false);
      return;
    }

    const followerIds = (followerRows ?? []).map((r) => r.follower_id);

    if (followerIds.length === 0) {
      setHasMore(false);
      setLoadingMore(false);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", followerIds);

    if (profilesError) {
      console.error(profilesError);
      setLoadingMore(false);
      return;
    }

    const newProfiles = (profilesData as ProfileRow[]) ?? [];
    const statuses = await resolveFollowStatuses(supabase, currentUserId, newProfiles.map((p) => p.id));

    setStatusMap((current) => ({ ...current, ...statuses }));
    setFollowers((current) => [...current, ...newProfiles]);
    setPage(nextPage);
    setHasMore(followerIds.length === PAGE_SIZE);
    setLoadingMore(false);
  }

  const sentinelRef = useInfiniteScroll({ hasMore, loading: loadingMore, onLoadMore: loadMore });

  async function handleRemove(followerId: string) {
    if (!currentUserId) return;
    const previous = followers;

    setFollowers((current) => current.filter((f) => f.id !== followerId));

    const supabase = createClient();
    const result = await removeFollower(supabase, currentUserId, followerId);

    if (!result.success) {
      setFollowers(previous);
      toast.showToast(result.errorMessage ?? "Could not remove this follower.", "error");
      return;
    }

    toast.showToast("Follower removed.", "success");
  }

  function handleFollowChange(userId: string, status: FollowStatus) {
    setStatusMap((current) => ({ ...current, [userId]: status }));
  }

  const filteredFollowers = followers.filter((f) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (f.full_name || "").toLowerCase().includes(term) || (f.bio || "").toLowerCase().includes(term);
  });

  const isOwner = currentUserId !== null && resolvedTargetId === currentUserId;

  if (checkingAuth) return null;

  if (gated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <span className="text-4xl">🔒</span>
        <p className="mt-4 text-lg font-medium text-slate-600">This account is private.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">
        {isOwner ? "Your Followers" : `${targetProfile?.full_name || "User"}'s Followers`}
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        {followers.length}
        {hasMore ? "+" : ""} {followers.length === 1 ? "follower" : "followers"}
      </p>

      <div className="relative mb-6">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search followers..."
          className="w-full rounded-full border border-slate-200 bg-white/90 py-2.5 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : filteredFollowers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white/70 px-8 py-16 text-center shadow-sm">
          <span className="text-4xl">👥</span>
          <p className="mt-4 text-base font-medium text-slate-600">
            {searchTerm.trim() ? "No followers match your search." : "No followers yet."}
          </p>
        </div>
      ) : (
        <>
          <motion.div layout className="space-y-2">
            {filteredFollowers.map((follower, index) => (
              <FollowListItem
                key={follower.id}
                profile={follower}
                currentUserId={currentUserId}
                index={index}
                followStatus={statusMap[follower.id] ?? "none"}
                showRemoveButton={isOwner}
                onFollowChange={handleFollowChange}
                onRemove={handleRemove}
              />
            ))}
          </motion.div>

          <div ref={sentinelRef} className="h-8 w-full" />

          {loadingMore && (
            <div className="mt-2 space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}