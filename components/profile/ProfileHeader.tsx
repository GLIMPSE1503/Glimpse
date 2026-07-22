"use client";

import { motion } from "framer-motion";
import { ProfileRow } from "@/lib/supabase/types";

type Props = {
  profile: ProfileRow | null;
  email: string | null;
  isOwnProfile: boolean;
  onEdit: () => void;
};

function formatJoinedDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(dateString)
  );
}

export default function ProfileHeader({ profile, email, isOwnProfile, onEdit }: Props) {
  const fullName = profile?.full_name || "Glimpse User";
  const bio = profile?.bio;
  const avatarUrl = profile?.avatar_url;
  const joined = profile?.created_at ? formatJoinedDate(profile.created_at) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center gap-5 rounded-[32px] border border-white/90 bg-white/90 p-8 text-center shadow-lg shadow-slate-200/40 backdrop-blur-xl sm:flex-row sm:items-center sm:text-left"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg shadow-slate-200/60 sm:h-32 sm:w-32"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-400">
            {fullName.charAt(0).toUpperCase()}
          </div>
        )}
      </motion.div>

      <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
        <h1 className="text-2xl font-semibold text-slate-900">{fullName}</h1>
        {email && <p className="text-sm text-slate-500">{email}</p>}
        {bio && <p className="max-w-md text-sm text-slate-600">{bio}</p>}
        {joined && <p className="text-xs text-slate-400">Joined {joined}</p>}

        <div className="mt-3">
          {isOwnProfile ? (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full bg-purple-500 px-5 py-2 text-sm font-medium text-white shadow-sm shadow-purple-200 transition hover:bg-purple-600"
            >
              Edit Profile
            </button>
          ) : (
            <button
              type="button"
              disabled
              title="Following is coming soon"
              className="cursor-not-allowed rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-400"
            >
              Follow (Coming Soon)
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}