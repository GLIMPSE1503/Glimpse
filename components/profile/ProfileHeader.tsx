"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ProfileRow } from "@/lib/supabase/types";
import FollowButton from "@/components/profile/FollowButton";

type FollowStatus = "none" | "following" | "requested";

type Props = {
  profile: ProfileRow | null;
  email: string | null;
  isOwnProfile: boolean;
  currentUserId: string | null;
  profileUserId: string;
  followStatus: FollowStatus;
  onFollowChange: (status: FollowStatus) => void;
  onEdit: () => void;
};

function formatJoinedDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(dateString));
}

export default function ProfileHeader({
  profile,
  email,
  isOwnProfile,
  currentUserId,
  profileUserId,
  followStatus,
  onFollowChange,
  onEdit,
}: Props) {
  const fullName = profile?.full_name || "Glimpse User";
  const bio = profile?.bio;
  const avatarUrl = profile?.avatar_url;
  const coverUrl = profile?.cover_url;
  const joined = profile?.created_at ? formatJoinedDate(profile.created_at) : null;

  return (
    <div className="overflow-hidden rounded-[32px] border border-white/90 bg-white/90 shadow-lg shadow-slate-200/40 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-32 w-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 sm:h-44"
        style={
          coverUrl
            ? { backgroundImage: `url(${coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      />

      <div className="flex flex-col items-center gap-4 px-6 pb-8 sm:flex-row sm:items-end sm:gap-6 sm:px-8">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          className="-mt-16 h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg shadow-slate-200/60 sm:h-32 sm:w-32"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-400">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>

        <div className="flex flex-1 flex-col items-center gap-2 text-center sm:items-start sm:pb-2 sm:text-left">
          <h1 className="text-2xl font-semibold text-slate-900">{fullName}</h1>
          {email && <p className="text-sm text-slate-500">{email}</p>}
          {bio && <p className="max-w-md text-sm text-slate-600">{bio}</p>}
          {joined && <p className="text-xs text-slate-400">Joined {joined}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:pb-2">
          {isOwnProfile ? (
            <>
              <Link
                href="/archive"
                className="rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-200"
              >
                🗄️ Archive
              </Link>
              <button
                type="button"
                onClick={onEdit}
                className="rounded-full bg-purple-500 px-5 py-2 text-sm font-medium text-white shadow-sm shadow-purple-200 transition hover:bg-purple-600"
              >
                Edit Profile
              </button>
            </>
          ) : (
            <FollowButton
              currentUserId={currentUserId}
              targetUserId={profileUserId}
              targetIsPrivate={profile?.is_private ?? false}
              initialStatus={followStatus}
              onChange={onFollowChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}