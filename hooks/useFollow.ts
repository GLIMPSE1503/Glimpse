"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { followPublicUser, unfollowUser, sendFollowRequest, cancelFollowRequest } from "@/lib/follow";
import type { FollowStatus } from "@/lib/supabase/types";

type UseFollowOptions = {
  currentUserId: string | null;
  targetUserId: string;
  targetIsPrivate: boolean;
  initialStatus: FollowStatus;
  onStatusChange?: (status: FollowStatus) => void;
};

type ToggleFollowResult = {
  success: boolean;
  errorMessage?: string;
};

type UseFollowResult = {
  status: FollowStatus;
  loading: boolean;
  toggleFollow: () => Promise<ToggleFollowResult>;
};

export function useFollow({
  currentUserId,
  targetUserId,
  targetIsPrivate,
  initialStatus,
  onStatusChange,
}: UseFollowOptions): UseFollowResult {
  const [status, setStatus] = useState<FollowStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  const isSelf = currentUserId === targetUserId;

  const updateStatus = useCallback(
    (next: FollowStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange]
  );

  const toggleFollow = useCallback(async (): Promise<ToggleFollowResult> => {
    if (!currentUserId) {
      return { success: false, errorMessage: "Sign in to follow people." };
    }
    if (isSelf) {
      return { success: false, errorMessage: "You can't follow yourself." };
    }
    if (loading) {
      return { success: false, errorMessage: "Please wait." };
    }

    const supabase = createClient();

    if (status === "following") {
      const previous = status;
      updateStatus("none");
      setLoading(true);
      const result = await unfollowUser(supabase, currentUserId, targetUserId);
      setLoading(false);

      if (!result.success) updateStatus(previous);
      return result;
    }

    if (status === "requested") {
      const previous = status;
      updateStatus("none");
      setLoading(true);
      const result = await cancelFollowRequest(supabase, currentUserId, targetUserId);
      setLoading(false);

      if (!result.success) updateStatus(previous);
      return result;
    }

    // status === "none"
    setLoading(true);

    if (targetIsPrivate) {
      updateStatus("requested");
      const result = await sendFollowRequest(supabase, currentUserId, targetUserId);
      setLoading(false);

      if (!result.success) updateStatus("none");
      return result;
    }

    updateStatus("following");
    const result = await followPublicUser(supabase, currentUserId, targetUserId);
    setLoading(false);

    if (!result.success) updateStatus("none");
    return result;
  }, [currentUserId, targetUserId, targetIsPrivate, status, isSelf, loading, updateStatus]);

  return { status, loading, toggleFollow };
}