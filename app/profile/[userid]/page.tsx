"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { getFollowerCount } from "@/lib/follow";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileMemoryGrid from "@/components/profile/ProfileMemoryGrid";
import EditProfileModal from "@/components/profile/EditProfileModal";
import ProfileCompletion from "@/components/profile/ProfileCompletion";
import PinnedMemories from "@/components/profile/PinnedMemories";
import MemoryStatsCards from "@/components/profile/MemoryStatsCards";
import MemoryCalendarHeatmap from "@/components/profile/MemoryCalendarHeatmap";
import { ProfileRow, GlimpseRow, MemoryStatsRow, FollowStatus } from "@/lib/supabase/types";

type Stats = {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesReceived: number;
};

export default function ProfilePage() {
  const params = useParams<{ userid: string }>();
  const profileUserId = params.userid;
  const toast = useToast();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [glimpses, setGlimpses] = useState<GlimpseRow[]>([]);
  const [followStatus, setFollowStatus] = useState<FollowStatus>("none");
  const [memoryStats, setMemoryStats] = useState<MemoryStatsRow | null>(null);
  const [stats, setStats] = useState<Stats>({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
    likesReceived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isOwnProfile = currentUserId !== null && currentUserId === profileUserId;

  async function loadProfile() {
    setLoading(true);
    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();
    const viewerId = userData?.user?.id ?? null;
    setCurrentUserId(viewerId);

    const [
      { data: profileData, error: profileError },
      { data: glimpsesData, error: glimpsesError },
      followersRes,
      followingRes,
      viewerFollowRes,
      viewerRequestRes,
      { data: statsData },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, bio, avatar_url, cover_url, is_private, notify_likes, notify_comments, notify_follows, auto_archive_enabled, language, created_at, updated_at"
        )
        .eq("id", profileUserId)
        .maybeSingle(),
      supabase
        .from("glimpses")
        .select("id, user_id, image_url, caption, created_at, expires_at, is_archived, archived_at, is_pinned")
        .eq("user_id", profileUserId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false }),
      supabase.from("followers").select("follower_id", { count: "exact", head: true }).eq("following_id", profileUserId),
      supabase.from("followers").select("following_id", { count: "exact", head: true }).eq("follower_id", profileUserId),
      viewerId
        ? supabase
            .from("followers")
            .select("follower_id")
            .eq("follower_id", viewerId)
            .eq("following_id", profileUserId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      viewerId
        ? supabase
            .from("follow_requests")
            .select("status")
            .eq("requester_id", viewerId)
            .eq("target_id", profileUserId)
            .eq("status", "pending")
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("memory_stats").select("*").eq("user_id", profileUserId).maybeSingle(),
    ]);

    if (profileError) console.error(profileError);
    if (glimpsesError) {
      console.error(glimpsesError);
      toast.showToast("Unable to load this profile's memories.", "error");
    }

    setProfile(profileData ?? null);
    setEmail(viewerId === profileUserId ? userData?.user?.email ?? null : null);

    if (viewerFollowRes.data) {
      setFollowStatus("following");
    } else if (viewerRequestRes.data) {
      setFollowStatus("requested");
    } else {
      setFollowStatus("none");
    }

    const loadedGlimpses = glimpsesData ?? [];
    setGlimpses(loadedGlimpses);
    setMemoryStats((statsData as MemoryStatsRow) ?? null);

    const glimpseIds = loadedGlimpses.map((g) => g.id);
    let likesReceived = 0;

    if (glimpseIds.length > 0) {
      const likesRes = await supabase
        .from("likes")
        .select("id", { count: "exact", head: true })
        .in("glimpse_id", glimpseIds);
      likesReceived = likesRes.count ?? 0;
    }

    setStats({
      postsCount: loadedGlimpses.length,
      followersCount: followersRes.count ?? 0,
      followingCount: followingRes.count ?? 0,
      likesReceived,
    });

    setLoading(false);
  }

  useEffect(() => {
    if (profileUserId) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserId]);

  // Real-time follower count: catches follows/unfollows that happen in
  // OTHER sessions/tabs, so this profile's count updates without a refresh.
  // (The viewer's own follow/unfollow action is already handled instantly
  // and optimistically by handleFollowChange below — this covers everyone else's.)
  useEffect(() => {
    if (!profileUserId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`profile-followers:${profileUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "followers", filter: `following_id=eq.${profileUserId}` },
        async () => {
          const count = await getFollowerCount(supabase, profileUserId);
          setStats((current) => ({ ...current, followersCount: count }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileUserId]);

  function handleFollowChange(nextStatus: FollowStatus) {
    setFollowStatus((previousStatus) => {
      setStats((current) => {
        const wasFollowing = previousStatus === "following";
        const isNowFollowing = nextStatus === "following";
        if (wasFollowing === isNowFollowing) return current;
        return {
          ...current,
          followersCount: Math.max(0, current.followersCount + (isNowFollowing ? 1 : -1)),
        };
      });
      return nextStatus;
    });
  }

  const pinnedGlimpses = glimpses.filter((g) => g.is_pinned);

  const streak = (() => {
    const dates = new Set(glimpses.map((g) => new Date(g.created_at).toDateString()));
    let count = 0;
    const cursor = new Date();
    while (dates.has(cursor.toDateString())) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  })();

  const canViewMemories = isOwnProfile || !profile?.is_private || followStatus === "following";

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-52 w-full animate-pulse rounded-[32px] bg-slate-200" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <ProfileHeader
        profile={profile}
        email={email}
        isOwnProfile={isOwnProfile}
        currentUserId={currentUserId}
        profileUserId={profileUserId}
        followStatus={followStatus}
        onFollowChange={handleFollowChange}
        onEdit={() => setIsEditOpen(true)}
      />

      {isOwnProfile && profile && (
        <div className="mt-6">
          <ProfileCompletion profile={profile} hasAtLeastOneMemory={glimpses.length > 0} />
        </div>
      )}

      <div className="mt-6">
        <ProfileStats stats={stats} profileUserId={profileUserId} />
      </div>

      {canViewMemories && memoryStats && (
        <div className="mt-6">
          <MemoryStatsCards stats={memoryStats} streak={streak} />
        </div>
      )}

      {canViewMemories && (
        <div className="mt-6">
          <MemoryCalendarHeatmap uploadDates={glimpses.map((g) => g.created_at)} />
        </div>
      )}

      {canViewMemories && (
        <PinnedMemories
          pinnedGlimpses={pinnedGlimpses}
          isOwner={isOwnProfile}
          onUnpin={(id) =>
            setGlimpses((current) => current.map((g) => (g.id === id ? { ...g, is_pinned: false } : g)))
          }
        />
      )}

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Memories</h2>
        {!canViewMemories ? (
          <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-16 text-center shadow-sm">
            <span className="text-4xl">🔒</span>
            <p className="mt-4 text-lg font-medium text-slate-600">This account is private.</p>
            <p className="mt-1 text-sm text-slate-400">Follow this account to see their memories and stories.</p>
          </div>
        ) : (
          <ProfileMemoryGrid glimpses={glimpses} currentUserId={currentUserId} onGlimpsesChange={setGlimpses} />
        )}
      </div>

      {isEditOpen && (
        <EditProfileModal
          profileId={profileUserId}
          initialFullName={profile?.full_name ?? ""}
          initialBio={profile?.bio ?? ""}
          initialAvatarUrl={profile?.avatar_url ?? ""}
          initialCoverUrl={profile?.cover_url ?? ""}
          onClose={() => setIsEditOpen(false)}
          onSaved={(updated) => {
            setProfile(updated);
            setIsEditOpen(false);
          }}
        />
      )}
    </div>
  );
}