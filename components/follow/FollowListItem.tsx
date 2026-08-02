"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import FollowButton from "@/components/profile/FollowButton";
import { ProfileRow, FollowStatus } from "@/lib/supabase/types";

type Variant = "default" | "followers" | "requests";

type Props = {
  profile: ProfileRow;
  currentUserId: string | null;
  index: number;
  variant?: Variant;
  /** @deprecated use `variant="followers"` instead. Kept for existing callers (e.g. Navbar). */
  showRemoveButton?: boolean;
  followStatus?: FollowStatus;
  onFollowChange?: (userId: string, status: FollowStatus) => void;
  onRemove?: (userId: string) => void;
  onAccept?: (userId: string) => void;
  onReject?: (userId: string) => void;
  onProfileClick?: () => void;
  actionLoading?: boolean;
};

export default function FollowListItem({
  profile,
  currentUserId,
  index,
  variant,
  showRemoveButton,
  followStatus = "none",
  onFollowChange,
  onRemove,
  onAccept,
  onReject,
  onProfileClick,
  actionLoading = false,
}: Props) {
  const resolvedVariant: Variant = variant ?? (showRemoveButton ? "followers" : "default");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3), ease: "easeOut" }}
      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
    >
      <Link href={`/profile/${profile.id}`} onClick={onProfileClick} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-100">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name ?? "User"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
              {(profile.full_name || "U").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{profile.full_name || "Glimpse User"}</p>
          {profile.bio && <p className="truncate text-xs text-slate-500">{profile.bio}</p>}
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        {resolvedVariant === "requests" ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onAccept?.(profile.id);
              }}
              disabled={actionLoading}
              className="rounded-full bg-purple-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-purple-600 disabled:opacity-60"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onReject?.(profile.id);
              }}
              disabled={actionLoading}
              className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-60"
            >
              Reject
            </button>
          </>
        ) : (
          <>
            <FollowButton
              currentUserId={currentUserId}
              targetUserId={profile.id}
              targetIsPrivate={profile.is_private}
              initialStatus={followStatus}
              onChange={(status) => onFollowChange?.(profile.id, status)}
              size="sm"
            />
            {resolvedVariant === "followers" && onRemove && (
              <button
                type="button"
                onClick={() => onRemove(profile.id)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"
              >
                Remove
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}