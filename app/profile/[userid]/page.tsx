"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileMemoryGrid from "@/components/profile/ProfileMemoryGrid";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { ProfileRow, GlimpseRow } from "@/lib/supabase/types";

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
  const [isFollowing, setIsFollowing] = useState(false);
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
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, bio, avatar_url, created_at, updated_at")
        .eq("id", profileUserId)
        .maybeSingle(),
      supabase
        .from("glimpses")
        .select("id, user_id, image_url, caption, created_at")
        .eq("user_id", profileUserId)
        .order("created_at", { ascending: false }),
      supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", profileUserId),
      supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", profileUserId),
      viewerId
        ? supabase
            .from("follows")
            .select("follower_id")
            .eq("follower_id", viewerId)
            .eq("following_id", profileUserId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (profileError) console.error(profileError);
    if (glimpsesError) {
      console.error(glimpsesError);
      toast.showToast("Unable to load this profile's memories.", "error");
    }

    setProfile(profileData ?? null);
    setEmail(viewerId === profileUserId ? userData?.user?.email ?? null : null);
    setIsFollowing(!!viewerFollowRes.data);

    const loadedGlimpses = glimpsesData ?? [];
    setGlimpses(loadedGlimpses);

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

  function handleFollowChange(nextIsFollowing: boolean) {
    setIsFollowing(nextIsFollowing);
    setStats((current) => ({
      ...current,
      followersCount: Math.max(0, current.followersCount + (nextIsFollowing ? 1 : -1)),
    }));
  }

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
        isFollowing={isFollowing}
        onFollowChange={handleFollowChange}
        onEdit={() => setIsEditOpen(true)}
      />

      <ProfileStats stats={stats} />

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Memories</h2>
        <ProfileMemoryGrid glimpses={glimpses} currentUserId={currentUserId} onGlimpsesChange={setGlimpses} />
      </div>

      {isEditOpen && (
        <EditProfileModal
          profileId={profileUserId}
          initialFullName={profile?.full_name ?? ""}
          initialBio={profile?.bio ?? ""}
          initialAvatarUrl={profile?.avatar_url ?? ""}
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