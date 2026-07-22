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

  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short" }).format(date);
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

type LikeState = { count: number; liked: boolean };

type Props = {
  glimpses: GlimpseRow[];
  currentUserId: string | null;
  onGlimpsesChange: (glimpses: GlimpseRow[]) => void;
};

export default function ProfileMemoryGrid({ glimpses, currentUserId, onGlimpsesChange }: Props) {
  const toast = useToast();
  const [likeState, setLikeState] = useState<Record<string, LikeState>>({});
  const [comments, setComments] = useState<Record<string, CommentRow[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    async function loadMeta() {
      const supabase = createClient();
      const glimpseIds = glimpses.map((g) => g.id);

      const [{ data: userData }, likesRes, commentsRes, favoritesRes] = await Promise.all([
        supabase.auth.getUser(),
        glimpseIds.length
          ? supabase.from("likes").select("id, glimpse_id, user_id").in("glimpse_id", glimpseIds)
          : Promise.resolve({ data: [] as { id: string; glimpse_id: string; user_id: string }[] }),
        glimpseIds.length
          ? supabase
              .from("comments")
              .select("id, glimpse_id, user_id, user_full_name, user_avatar_url, content, created_at")
              .in("glimpse_id", glimpseIds)
              .order("created_at", { ascending: true })
          : Promise.resolve({ data: [] as CommentRow[] }),
        currentUserId
          ? supabase.from("favorites").select("id, glimpse_id").eq("user_id", currentUserId)
          : Promise.resolve({ data: [] as { id: string; glimpse_id: string }[] }),
      ]);

      const viewerId = userData?.user?.id ?? null;
      setCurrentUserName(userData?.user?.user_metadata?.full_name ?? null);
      setCurrentUserAvatar(userData?.user?.user_metadata?.avatar_url ?? null);

      const aggregatedLikes = glimpses.reduce((acc, g) => {
        acc[g.id] = { count: 0, liked: false };
        return acc;
      }, {} as Record<string, LikeState>);

      (likesRes.data ?? []).forEach((like) => {
        if (!aggregatedLikes[like.glimpse_id]) aggregatedLikes[like.glimpse_id] = { count: 0, liked: false };
        aggregatedLikes[like.glimpse_id].count += 1;
        if (like.user_id === viewerId) aggregatedLikes[like.glimpse_id].liked = true;
      });
      setLikeState(aggregatedLikes);

      const groupedComments = (commentsRes.data ?? []).reduce((acc: Record<string, CommentRow[]>, c) => {
        acc[c.glimpse_id] = [...(acc[c.glimpse_id] ?? []), c];
        return acc;
      }, {});
      setComments(groupedComments);

      const aggregatedFavorites = (favoritesRes.data ?? []).reduce(
        (acc: Record<string, boolean>, f) => {
          acc[f.glimpse_id] = true;
          return acc;
        },
        {}
      );
      setFavorites(aggregatedFavorites);
    }

    if (glimpses.length > 0) {
      loadMeta();
    }
  }, [glimpses, currentUserId]);

  useEffect(() => {
    if (selectedIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowRight") {
        setSelectedIndex((c) => (c !== null && c < glimpses.length - 1 ? c + 1 : c));
      }
      if (event.key === "ArrowLeft") {
        setSelectedIndex((c) => (c !== null && c > 0 ? c - 1 : c));
      }
    }

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

    if (deltaX > 60) setSelectedIndex((c) => (c && c > 0 ? c - 1 : c));
    if (deltaX < -60) {
      setSelectedIndex((c) => (c !== null && c < glimpses.length - 1 ? c + 1 : c));
    }
  }

  async function toggleLike(glimpseId: string) {
    const supabase = createClient();
    if (!currentUserId) {
      toast.showToast("Sign in to like memories.", "info");
      return;
    }

    const current = likeState[glimpseId] ?? { count: 0, liked: false };
    const nextLiked = !current.liked;
    const nextCount = current.count + (nextLiked ? 1 : -1);

    setLikeState((state) => ({
      ...state,
      [glimpseId]: { count: Math.max(0, nextCount), liked: nextLiked },
    }));

    if (nextLiked) {
      const { error } = await supabase
        .from("likes")
        .insert({ glimpse_id: glimpseId, user_id: currentUserId })
        .select("id")
        .single();

      if (error) {
        setLikeState((state) => ({
          ...state,
          [glimpseId]: { count: Math.max(0, state[glimpseId]?.count - 1), liked: false },
        }));
        toast.showToast("Could not save your like.", "error");
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("glimpse_id", glimpseId)
        .eq("user_id", currentUserId);

      if (error) {
        setLikeState((state) => ({
          ...state,
          [glimpseId]: { count: (state[glimpseId]?.count ?? 0) + 1, liked: true },
        }));
        toast.showToast("Could not remove your like.", "error");
      }
    }
  }

  async function postComment(glimpseId: string) {
    const text = (commentDrafts[glimpseId] || "").trim();
    if (!currentUserId) {
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
      user_id: currentUserId,
      user_full_name: currentUserName,
      user_avatar_url: currentUserAvatar,
      content: text,
      created_at: new Date().toISOString(),
    };

    setComments((state) => ({ ...state, [glimpseId]: [...(state[glimpseId] || []), newComment] }));
    setCommentDrafts((drafts) => ({ ...drafts, [glimpseId]: "" }));

    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({
        glimpse_id: glimpseId,
        user_id: currentUserId,
        user_full_name: currentUserName,
        user_avatar_url: currentUserAvatar,
        content: text,
      })
      .select("id, glimpse_id, user_id, user_full_name, user_avatar_url, content, created_at")
      .single();

    if (error) {
      setComments((state) => ({
        ...state,
        [glimpseId]: (state[glimpseId] || []).filter((c) => c.id !== newComment.id),
      }));
      toast.showToast("Could not post your comment.", "error");
      return;
    }

    setComments((state) => ({
      ...state,
      [glimpseId]: (state[glimpseId] || []).map((c) => (c.id === newComment.id ? (data as CommentRow) : c)),
    }));
  }

  async function deleteComment(glimpseId: string, commentId: string) {
    if (!currentUserId) return;

    const existingComment = (comments[glimpseId] || []).find((c) => c.id === commentId);
    if (!existingComment || existingComment.user_id !== currentUserId) {
      toast.showToast("You can only delete your own comments.", "error");
      return;
    }

    setComments((state) => ({
      ...state,
      [glimpseId]: (state[glimpseId] || []).filter((c) => c.id !== commentId),
    }));

    const supabase = createClient();
    const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", currentUserId);

    if (error) {
      setComments((state) => ({ ...state, [glimpseId]: [...(state[glimpseId] || []), existingComment] }));
      toast.showToast("Could not delete the comment.", "error");
    }
  }

  async function toggleFavorite(glimpseId: string) {
    if (!currentUserId) {
      toast.showToast("Sign in to favorite memories.", "info");
      return;
    }

    const wasFavorited = !!favorites[glimpseId];
    const nextFavorited = !wasFavorited;

    setFavorites((current) => ({ ...current, [glimpseId]: nextFavorited }));

    const supabase = createClient();

    if (nextFavorited) {
      const { error } = await supabase
        .from("favorites")
        .insert({ glimpse_id: glimpseId, user_id: currentUserId })
        .select("id")
        .single();

      if (error) {
        setFavorites((current) => ({ ...current, [glimpseId]: wasFavorited }));
        toast.showToast("Could not save your favorite.", "error");
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("glimpse_id", glimpseId)
        .eq("user_id", currentUserId);

      if (error) {
        setFavorites((current) => ({ ...current, [glimpseId]: wasFavorited }));
        toast.showToast("Could not remove your favorite.", "error");
      }
    }
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
    const { error } = await supabase.from("glimpses").update({ caption: editCaption }).eq("id", glimpseId);

    if (error) {
      toast.showToast("Could not update caption.", "error");
      return;
    }

    onGlimpsesChange(glimpses.map((g) => (g.id === glimpseId ? { ...g, caption: editCaption } : g)));
    setEditingId(null);
    setEditCaption("");
    toast.showToast("Caption updated ✨", "success");
  }

  async function deleteMemory(glimpseId: string) {
    if (!currentUserId) return;

    const confirmed = window.confirm("Delete this memory permanently?");
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from("glimpses").delete().eq("id", glimpseId).eq("user_id", currentUserId);

    if (error) {
      toast.showToast("Could not delete memory.", "error");
      return;
    }

    const deletedIndex = glimpses.findIndex((g) => g.id === glimpseId);
    onGlimpsesChange(glimpses.filter((g) => g.id !== glimpseId));

    setSelectedIndex((current) => (current !== null && current === deletedIndex ? null : current));
    toast.showToast("Memory deleted.", "success");
  }

  const selectedGlimpse = selectedIndex === null ? null : glimpses[selectedIndex] ?? null;

  if (glimpses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-16 text-center shadow-sm">
        <span className="text-4xl">🖼️</span>
        <p className="mt-4 text-lg font-medium text-slate-600">No memories yet ✨</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {glimpses.map((glimpse, index) => {
          const glanceLikes = likeState[glimpse.id] ?? { count: 0, liked: false };
          const glimpseComments = comments[glimpse.id] ?? [];
          const isOwner = currentUserId === glimpse.user_id;
          const isEditing = editingId === glimpse.id;
          const isFavorited = !!favorites[glimpse.id];

          return (
            <motion.article
              key={glimpse.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: Math.min(index * 0.03, 0.3) }}
              whileHover={{ y: -6 }}
              className="flex flex-col overflow-hidden rounded-[28px] border border-white/90 bg-white/90 shadow-lg shadow-slate-200/40 backdrop-blur-xl transition duration-300"
            >
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
                  onDraftChange={(value) => setCommentDrafts((drafts) => ({ ...drafts, [glimpse.id]: value }))}
                  onSubmit={() => postComment(glimpse.id)}
                  onDelete={(commentId) => deleteComment(glimpse.id, commentId)}
                />
              </div>
            </motion.article>
          );
        })}
      </div>

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
                onClick={() => setSelectedIndex((c) => (c !== null && c > 0 ? c - 1 : c))}
                className="absolute left-4 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-white shadow-lg shadow-slate-900/40 transition hover:bg-slate-800"
                aria-label="Previous image"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedIndex((c) => (c !== null && c < glimpses.length - 1 ? c + 1 : c))
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