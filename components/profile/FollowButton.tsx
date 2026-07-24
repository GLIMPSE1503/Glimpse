"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";

type Props = {
  currentUserId: string | null;
  targetUserId: string;
  initialIsFollowing: boolean;
  onChange?: (isFollowing: boolean) => void;
  size?: "sm" | "md";
};

export default function FollowButton({
  currentUserId,
  targetUserId,
  initialIsFollowing,
  onChange,
  size = "md",
}: Props) {
  const toast = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  async function toggleFollow() {
    if (!currentUserId) {
      toast.showToast("Sign in to follow people.", "info");
      return;
    }
    if (loading) return;

    const wasFollowing = isFollowing;
    const next = !wasFollowing;

    setIsFollowing(next);
    onChange?.(next);
    setLoading(true);

    const supabase = createClient();

    if (next) {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: currentUserId, following_id: targetUserId });

      if (error) {
        console.error(error);
        setIsFollowing(wasFollowing);
        onChange?.(wasFollowing);
        toast.showToast("Could not follow this user.", "error");
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId);

      if (error) {
        console.error(error);
        setIsFollowing(wasFollowing);
        onChange?.(wasFollowing);
        toast.showToast("Could not unfollow this user.", "error");
      }
    }

    setLoading(false);
  }

  const padding = size === "sm" ? "px-4 py-1.5 text-xs" : "px-5 py-2 text-sm";

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={loading}
      className={`rounded-full font-medium shadow-sm transition ${padding} ${
        isFollowing
          ? "border border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          : "bg-purple-500 text-white shadow-purple-200 hover:bg-purple-600"
      } disabled:opacity-60`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}