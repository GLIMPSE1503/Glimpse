"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";
import { CommentRow, GlimpseRow } from "@/lib/supabase/types";

function formatRelativeTime(createdAt: string) {
  const date = new Date(createdAt);
  const now = new Date();
  const deltaMinutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));

  if (deltaMinutes < 1) return "Just now";
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;

  const hours = Math.floor(deltaMinutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatFullDateTime(createdAt: string) {
  const date = new Date(createdAt);
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type LikeState = {
  count: number;
  liked: boolean;
};

const skeletonCount = 4;

export default function GlimpseFeed() {
  const toast = useToast();
  const [glimpses, setGlimpses] = useState<GlimpseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [likeState, setLikeState] = useState<Record<string, LikeState>>({});
  const [comments, setComments] = useState<Record<string, CommentRow[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Favorites (local-only, no DB yet)
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      const supabase = createClient();

      const [
        { data: userData },
        { data: glimpsesData, error: glimpsesError },
        { data: likesData, error: likesError },
        { data: commentsData, error: commentsError },
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("glimpses")
          .select("id, user_id, image_url, caption, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("likes").select("id, glimpse_id, user_id"),
        supabase
          .from("comments")
          .select("id, glimpse_id, user_id, user_full_name, user_avatar_url, content, created_at")
          .order("created_at", { ascending: true }),
      ]);

      if (glimpsesError) {
        console.error(glimpsesError);
        toast.showToast("Unable to load memories.", "error");
      }

      if (likesError) {
        console.error(likesError);
      }

      if (commentsError) {
        console.error(commentsError);
      }

      setCurrentUserId(userData?.user?.id ?? null);
      setCurrentUserName(userData?.user?.user_metadata?.full_name ?? null);
      setCurrentUserAvatar(userData?.user?.user_metadata?.avatar_url ?? null);

      const loadedGlimpses = glimpsesData ?? [];
      setGlimpses(loadedGlimpses);

      const aggregatedLikes = loadedGlimpses.reduce((acc, glimpse) => {
        acc[glimpse.id] = { count: 0, liked: false };
        return acc;
      }, {} as Record<string, LikeState>);

      (likesData ?? []).forEach((like: { id: string; glimpse_id: string; user_id: string }) => {
        if (!aggregatedLikes[like.glimpse_id]) {
          aggregatedLikes[like.glimpse_id] = { count: 0, liked: false };
        }
        aggregatedLikes[like.glimpse_id].count += 1;
        if (like.user_id === userData?.user?.id) {
          aggregatedLikes[like.glimpse_id].liked = true;
        }
      });

      setLikeState(aggregatedLikes);

      const groupedComments = (commentsData ?? []).reduce((acc: Record<string, CommentRow[]>, comment: CommentRow) => {
        acc[comment.glimpse_id] = [...(acc[comment.glimpse_id] ?? []), comment];
        return acc;
      }, {});

      setComments(groupedComments);
      setLoading(false);
    }

    loadFeed();
  }, [toast]);

  useEffect(() => {
    if (selectedIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedIndex(null);
      }

      if (event.key === "ArrowRight") {
        setSelectedIndex((current) => {
          if (current === null) return null;
          return current < glimpses.length - 1 ? current + 1 : current;
        });
      }

      if (event.key === "ArrowLeft") {
        setSelectedIndex((current) => {
          if (current === null) return null;
          return current > 0 ? current - 1 : current;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, glimpses.length]);

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0]?.clientX - touchStartX.current;
    touchStartX.current = null;

    if (deltaX > 60) {
      setSelectedIndex((current) => (current && current > 0 ? current - 1 : current));
    }

    if (deltaX < -60) {
      setSelectedIndex((current) =>
        current !== null && current < glimpses.length - 1 ? current + 1 : current
      );
    }
  }

  async function toggleLike(glimpseId: string) {
    const supabase = createClient();
    const userId = currentUserId;

    if (!userId) {
      toast.showToast("Sign in to like memories.", "info");
      return;
    }

    const current = likeState[glimpseId] ?? { count: 0, liked: false };
    const nextLiked = !current.liked;
    const nextCount = current.count + (nextLiked ? 1 : -1);

    setLikeState((state) => ({
      ...state,
      [glimpseId]: {
        count: Math.max(0, nextCount),
        liked: nextLiked,
      },
    }));

    if (nextLiked) {
      const { error } = await supabase
        .from("likes")
        .insert({ glimpse_id: glimpseId, user_id: userId })
        .select("id")
        .single();

      if (error) {
        console.error("Like error:", error);
        setLikeState((state) => ({
          ...state,
          [glimpseId]: {
            count: Math.max(0, state[glimpseId]?.count - 1),
            liked: false,
          },
        }));
        toast.showToast("Could not save your like.", "error");
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("glimpse_id", glimpseId)
        .eq("user_id", userId);

      if (error) {
        console.error("Unlike error:", error);
        setLikeState((state) => ({
          ...state,
          [glimpseId]: {
            count: (state[glimpseId]?.count ?? 0) + 1,
            liked: true,
          },
        }));
        toast.showToast("Could not remove your like.", "error");
      }
    }
  }

  async function postComment(glimpseId: string) {
    const userId = currentUserId;
    const text = (commentDrafts[glimpseId] || "").trim();

    if (!userId) {
      toast.showToast("Sign in to comment.", "info");
      return;
    }

    if (!text) {
      toast.showToast("Write something before posting.", "info");
      return;
    }

    const newComment: CommentRow = {
      id: `temp-${glimpseId}-${Date.now()}`,
      glimpse_id: glimpseId,
      user_id: userId,
      user_full_name: currentUserName,
      user_avatar_url: currentUserAvatar,
      content: text,
      created_at: new Date().toISOString(),
    };

    setComments((state) => ({
      ...state,
      [glimpseId]: [...(state[glimpseId] || []), newComment],
    }));
    setCommentDrafts((drafts) => ({ ...drafts, [glimpseId]: "" }));

    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({
        glimpse_id: glimpseId,
        user_id: userId,
        user_full_name: currentUserName,
        user_avatar_url: currentUserAvatar,
        content: text,
      })
      .select("id, glimpse_id, user_id, user_full_name, user_avatar_url, content, created_at")
      .single();

    if (error) {
      console.error("Comment post error:", error);
      setComments((state) => ({
        ...state,
        [glimpseId]: (state[glimpseId] || []).filter((comment) => comment.id !== newComment.id),
      }));
      toast.showToast("Could not post your comment.", "error");
      return;
    }

    setComments((state) => ({
      ...state,
      [glimpseId]: (state[glimpseId] || []).map((comment) =>
        comment.id === newComment.id ? (data as CommentRow) : comment
      ),
    }));
  }

  async function deleteComment(glimpseId: string, commentId: string) {
    const userId = currentUserId;
    if (!userId) return;

    const existingComment = (comments[glimpseId] || []).find((comment) => comment.id === commentId);
    if (!existingComment || existingComment.user_id !== userId) {
      toast.showToast("You can only delete your own comments.", "error");
      return;
    }

    setComments((state) => ({
      ...state,
      [glimpseId]: (state[glimpseId] || []).filter((comment) => comment.id !== commentId),
    }));

    const supabase = createClient();
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId);

    if (error) {
      console.error("Comment delete error:", error);
      setComments((state) => ({
        ...state,
        [glimpseId]: [...(state[glimpseId] || []), existingComment],
      }));
      toast.showToast("Could not delete the comment.", "error");
    }
  }

  async function deleteMemory(glimpseId: string) {
    if (!currentUserId) return;

    const confirmed = window.confirm("Delete this memory permanently?");
    if (!confirmed) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("glimpses")
      .delete()
      .eq("id", glimpseId)
      .eq("user_id", currentUserId);

    if (error) {
      toast.showToast("Could not delete memory.", "error");
      return;
    }

    setGlimpses((current) => current.filter((g) => g.id !== glimpseId));

    // Close viewer if the deleted memory was open
    setSelectedIndex((current) => {
      if (current === null) return null;
      const wasSelectedDeleted = glimpses[current]?.id === glimpseId;
      return wasSelectedDeleted ? null : current;
    });

    toast.showToast("Memory deleted.", "success");
  }

  function startEditing(glimpse: GlimpseRow) {
    setEditingId(glimpse.id);
    setEditCaption(glimpse.caption || "");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditCaption("");
  }

  async function updateCaption(glimpseId: string) {
    if (!editCaption.trim()) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("glimpses")
      .update({ caption: editCaption })
      .eq("id", glimpseId);

    if (error) {
      toast.showToast("Could not update caption.", "error");
      return;
    }

    setGlimpses((current) =>
      current.map((g) => (g.id === glimpseId ? { ...g, caption: editCaption } : g))
    );

    setEditingId(null);
    setEditCaption("");

    toast.showToast("Caption updated ✨", "success");
  }

  function toggleFavorite(glimpseId: string) {
    setFavorites((current) => ({
      ...current,
      [glimpseId]: !current[glimpseId],
    }));
  }

  const searchedGlimpses = glimpses.filter((g) =>
    (g.caption || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGlimpses = showFavoritesOnly
    ? searchedGlimpses.filter((g) => favorites[g.id])
    : searchedGlimpses;

  const selectedGlimpse = selectedIndex === null ? null : glimpses[selectedIndex] ?? null;

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden rounded-[28px] bg-white/80 p-6 shadow-lg shadow-slate-200/50"
          >
            <div className="aspect-[4/3] w-full rounded-[20px] bg-slate-200" />
            <div className="mt-5 space-y-3">
              <div className="h-5 w-2/4 rounded-full bg-slate-200" />
              <div className="h-4 w-3/4 rounded-full bg-slate-200" />
              <div className="h-10 w-full rounded-3xl bg-slate-200" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Search + Favorites controls */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search memories by caption..."
            className="w-full rounded-full border border-slate-200 bg-white/90 py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm shadow-slate-200/60 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFavoritesOnly((current) => !current)}
          className={`inline-flex items-center justify-center gap-2 self-start rounded-full px-5 py-3 text-sm font-medium shadow-sm transition sm:self-auto ${
            showFavoritesOnly
              ? "bg-amber-400 text-white shadow-amber-200"
              : "bg-white/90 text-slate-600 shadow-slate-200/60 hover:bg-slate-50"
          }`}
        >
          <span aria-hidden="true">{showFavoritesOnly ? "★" : "☆"}</span>
          {showFavoritesOnly ? "Showing Favorites" : "Show Favorites Only"}
        </button>
      </div>

      {/* Empty states */}
      {glimpses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-20 text-center shadow-sm">
          <span className="text-4xl">🖼️</span>
          <p className="mt-4 text-lg font-medium text-slate-600">
            Your memories will appear here ✨
          </p>
        </div>
      ) : filteredGlimpses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-20 text-center shadow-sm">
          <span className="text-4xl">🔎</span>
          <p className="mt-4 text-lg font-medium text-slate-600">No memories found.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {filteredGlimpses.map((glimpse) => {
            const index = glimpses.findIndex((g) => g.id === glimpse.id);
            const glanceLikes = likeState[glimpse.id] ?? { count: 0, liked: false };
            const glimpseComments = comments[glimpse.id] ?? [];
            const isOwner = currentUserId === glimpse.user_id;
            const isEditing = editingId === glimpse.id;
            const isFavorited = !!favorites[glimpse.id];

            return (
              <motion.article
                key={glimpse.id}
                layout
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex flex-col overflow-hidden rounded-[28px] border border-white/90 bg-white/90 shadow-lg shadow-slate-200/40 backdrop-blur-xl transition duration-300"
              >
                {/* Image */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className="group relative block aspect-[4/3] w-full overflow-hidden bg-slate-100"
                  >
                    <motion.img
                      src={glimpse.image_url}
                      alt={glimpse.caption ?? "Memory image"}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-4">
                      <span className="hidden rounded-full border border-white/25 bg-slate-950/50 p-3 text-white shadow-lg transition duration-300 group-hover:inline-flex">
                        ⤢
                      </span>
                    </div>
                  </button>

                  {/* Favorite button, floating over the image */}
                  <button
                    type="button"
                    onClick={() => toggleFavorite(glimpse.id)}
                    aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                    className={`absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition ${
                      isFavorited
                        ? "border-amber-300 bg-amber-400/90 text-white"
                        : "border-white/60 bg-white/70 text-slate-500 hover:bg-white"
                    }`}
                  >
                    {isFavorited ? "★" : "☆"}
                  </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    {isEditing ? (
                      <div className="flex w-full flex-col gap-2">
                        <input
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                          placeholder="Update your caption..."
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateCaption(glimpse.id)}
                            className="rounded-full bg-purple-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm shadow-purple-200 hover:bg-purple-600"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base font-semibold leading-6 text-slate-900">
                        {glimpse.caption || "Untitled Memory ✨"}
                      </p>
                    )}

                    {isOwner && !isEditing && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(glimpse)}
                          className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600 hover:bg-purple-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMemory(glimpse.id)}
                          className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Clean single metadata row: ❤️ count 💬 count 🕒 time */}
                  <div className="flex items-center gap-5 text-sm text-slate-500">
                    <LikeButton
                      count={glanceLikes.count}
                      liked={glanceLikes.liked}
                      disabled={!currentUserId}
                      onToggle={() => toggleLike(glimpse.id)}
                    />
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true">💬</span>
                      <span>{glimpseComments.length}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true">🕒</span>
                      <span>{formatRelativeTime(glimpse.created_at)}</span>
                    </span>
                  </div>

                  <CommentSection
                    comments={glimpseComments}
                    draft={commentDrafts[glimpse.id] ?? ""}
                    disabled={false}
                    currentUserId={currentUserId ?? undefined}
                    onDraftChange={(value) =>
                      setCommentDrafts((drafts) => ({ ...drafts, [glimpse.id]: value }))
                    }
                    onSubmit={() => postComment(glimpse.id)}
                    onDelete={(commentId) => deleteComment(glimpse.id, commentId)}
                  />
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Fullscreen viewer */}
      <AnimatePresence>
        {selectedGlimpse ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <motion.div
              className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950 shadow-2xl"
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedIndex(null)}
                className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 text-white shadow-lg shadow-slate-900/40 transition hover:bg-slate-800"
                aria-label="Close viewer"
              >
                ✕
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedIndex((current) => (current !== null && current > 0 ? current - 1 : current))
                }
                className="absolute left-4 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-white shadow-lg shadow-slate-900/40 transition hover:bg-slate-800"
                aria-label="Previous image"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedIndex((current) =>
                    current !== null && current < glimpses.length - 1 ? current + 1 : current
                  )
                }
                className="absolute right-4 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-white shadow-lg shadow-slate-900/40 transition hover:bg-slate-800"
                aria-label="Next image"
              >
                ›
              </button>

              <img
                src={selectedGlimpse.image_url}
                alt={selectedGlimpse.caption ?? "Memory image"}
                className="h-[80vh] w-full object-contain"
              />

              {/* Caption + date overlay */}
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-6 pt-16">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-base font-medium text-white">
                      {selectedGlimpse.caption || "Untitled Memory ✨"}
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      {formatFullDateTime(selectedGlimpse.created_at)}
                    </p>
                  </div>

                  {currentUserId === selectedGlimpse.user_id && (
                    <button
                      type="button"
                      onClick={() => startEditing(selectedGlimpse)}
                      className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}