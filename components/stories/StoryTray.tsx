"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import StoryViewer from "@/components/stories/StoryViewer";
import { StoryGroup, StoryRow } from "@/lib/supabase/types";

type Props = {
  currentUserId: string | null;
  onUploadStory: () => void;
};

export default function StoryTray({ currentUserId, onUploadStory }: Props) {
  const toast = useToast();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingGroupIndex, setViewingGroupIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadStories() {
      setLoading(true);
      const supabase = createClient();

      let followingIds: string[] = [];
      if (currentUserId) {
        const { data: followsData, error: followsError } = await supabase
          .from("followers")
          .select("following_id")
          .eq("follower_id", currentUserId);

        if (followsError) console.error(followsError);
        followingIds = (followsData ?? []).map((f) => f.following_id);
      }

      const allowedUserIds = currentUserId ? [currentUserId, ...followingIds] : [];

      const { data, error } = allowedUserIds.length > 0
        ? await supabase
            .from("stories")
            .select("id, user_id, image_url, created_at")
            .in("user_id", allowedUserIds)
            .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order("created_at", { ascending: true })
        : { data: [] as StoryRow[], error: null };

      if (error) {
        console.error(error);
        toast.showToast("Could not load stories.", "error");
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as StoryRow[];
      const userIds = Array.from(new Set(rows.map((s) => s.user_id)));

      let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        profileMap = (profilesData ?? []).reduce((acc, p) => {
          acc[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
          return acc;
        }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>);
      }

      const grouped = userIds.map((userId) => ({
        userId,
        authorName: profileMap[userId]?.full_name || "Glimpse User",
        authorAvatar: profileMap[userId]?.avatar_url ?? null,
        stories: rows.filter((s) => s.user_id === userId),
      }));

      // Current user's own tray always shows first
      grouped.sort((a, b) => {
        if (a.userId === currentUserId) return -1;
        if (b.userId === currentUserId) return 1;
        return 0;
      });

      setGroups(grouped);
      setLoading(false);
    }

    loadStories();
  }, [currentUserId, toast]);

  if (loading) {
    return (
      <div className="mb-6 flex gap-4 overflow-x-auto pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 w-20 shrink-0 animate-pulse rounded-full bg-slate-200" />
        ))}
      </div>
    );
  }

  const hasOwnStory = groups.some((g) => g.userId === currentUserId);

  return (
    <>
      <div className="mb-6 flex gap-4 overflow-x-auto pb-1">
        {currentUserId && !hasOwnStory && (
          <button
            type="button"
            onClick={onUploadStory}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-purple-300 bg-purple-50 text-xl text-purple-500">
              +
            </div>
            <span className="text-xs text-slate-500">Your story</span>
          </button>
        )}

        {groups.map((group, index) => (
          <motion.button
            key={group.userId}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewingGroupIndex(index)}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <div className="rounded-full bg-gradient-to-tr from-fuchsia-400 via-purple-500 to-indigo-400 p-[3px]">
              <div className="rounded-full bg-white p-[2px]">
                <div className="h-16 w-16 overflow-hidden rounded-full bg-slate-100">
                  {group.authorAvatar ? (
                    <img
                      src={group.authorAvatar}
                      alt={group.authorName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-400">
                      {group.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <span className="max-w-[64px] truncate text-xs text-slate-600">
              {group.userId === currentUserId ? "Your story" : group.authorName}
            </span>
          </motion.button>
        ))}
      </div>

      {viewingGroupIndex !== null && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={viewingGroupIndex}
          onClose={() => setViewingGroupIndex(null)}
        />
      )}
    </>
  );
}