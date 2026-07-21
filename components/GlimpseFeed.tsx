"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";
import { CommentRow, GlimpseRow } from "@/lib/supabase/types";

type LikeState = {
  count: number;
  liked: boolean;
};

export default function GlimpseFeed() {
  const toast = useToast();
  const [glimpses, setGlimpses] = useState<GlimpseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGlimpse, setSelectedGlimpse] = useState<GlimpseRow | null>(null);
  const [likeState, setLikeState] = useState<Record<string, LikeState>>({});
  const [comments, setComments] = useState<Record<string, CommentRow[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      const supabase = createClient();

      const [{ data: userData }, { data: glimpsesData, error: glimpsesError }, { data: likesData, error: likesError }, { data: commentsData, error: commentsError }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("glimpses").select("id, user_id, image_url, caption, created_at").order("created_at", { ascending: false }),
        supabase.from("likes").select("id, glimpse_id, user_id"),
        supabase.from("comments").select("id, glimpse_id, user_id, user_full_name, user_avatar_url, content, created_at").order("created_at", { ascending: true }),
      ]);

      if (glimpsesError) {
        console.error(glimpsesError);
        toast.showToast("Unable to load memories.", "error");
      }

      if (likesError) {
        console.error(likesError);
        toast.showToast("Unable to load likes.", "error");
      }

      if (commentsError) {
        console.error(commentsError);
        toast.showToast("Unable to load comments.", "error");
      }

      const user = userData?.user ?? null;
      setCurrentUserId(user?.id ?? null);
      setCurrentUserName(user?.user_metadata?.full_name ?? null);
      setCurrentUserAvatar(user?.user_metadata?.avatar_url ?? null);

      const loadedGlimpses = glimpsesData || [];
      setGlimpses(loadedGlimpses);

      const likes = likesData || [];
      const aggregatedLikes = loadedGlimpses.reduce((acc, glimpse) => {
        acc[glimpse.id] = { count: 0, liked: false };
        return acc;
      }, {} as Record<string, LikeState>);

      likes.forEach((like: { id: string; glimpse_id: string; user_id: string }) => {
        if (!aggregatedLikes[like.glimpse_id]) {
          aggregatedLikes[like.glimpse_id] = { count: 0, liked: false };
        }
        aggregatedLikes[like.glimpse_id].count += 1;
        if (like.user_id === user?.id) {
          aggregatedLikes[like.glimpse_id].liked = true;
        }
      });

      setLikeState(aggregatedLikes);

      const commentRows = (commentsData || []) as CommentRow[];
      const groupedComments = commentRows.reduce((acc, comment) => {
        if (!acc[comment.glimpse_id]) {
          acc[comment.glimpse_id] = [];
        }
        acc[comment.glimpse_id].push(comment);
        return acc;
      }, {} as Record<string, CommentRow[]>);

      setComments(groupedComments);
      setLoading(false);
    }

    loadFeed();
  }, [toast]);

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

        if (error.code === "23505") {
          toast.showToast("You already liked this memory.", "info");
        } else {
          toast.showToast("Could not save your like.", "error");
        }
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

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold mb-6 text-purple-700 flex items-center gap-2">
          Your Memories 💜
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-3xl bg-white/90 p-6 shadow-xl">
              <div className="h-72 w-full rounded-[32px] bg-slate-200" />
              <div className="mt-5 space-y-3">
                <div className="h-5 w-3/4 rounded-full bg-slate-200" />
                <div className="h-4 w-1/2 rounded-full bg-slate-200" />
                <div className="h-10 w-full rounded-2xl bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <h2 className="text-4xl font-bold mb-6 text-purple-700 flex items-center gap-2">
        Your Memories 💜
      </h2>

      {glimpses.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-10 text-center shadow-lg">
          <p className="text-gray-500">No memories yet. Upload your first Glimpse ✨</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {glimpses.map((glimpse) => {
            const glanceLikes = likeState[glimpse.id] ?? { count: 0, liked: false };
            const glimpseComments = comments[glimpse.id] ?? [];

            return (
              <div
                key={glimpse.id}
                className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl border border-pink-100 transition-all hover:shadow-2xl"
              >
                <button
                  type="button"
                  className="group block w-full overflow-hidden"
                  onClick={() => setSelectedGlimpse(glimpse)}
                >
                  <img
                    src={glimpse.image_url}
                    alt="glimpse"
                    className="w-full h-[350px] object-cover transition duration-300 group-hover:scale-105"
                  />
                </button>

                <div className="p-5">
                  {glimpse.caption && <p className="text-lg text-gray-700 mb-3">{glimpse.caption}</p>}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500">
                    <span>{new Date(glimpse.created_at).toLocaleString()}</span>
                    <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">Tap image to view</span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <LikeButton
                      count={glanceLikes.count}
                      liked={glanceLikes.liked}
                      disabled={!currentUserId}
                      onToggle={() => toggleLike(glimpse.id)}
                    />
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
              </div>
            );
          })}
        </div>
      )}

      {selectedGlimpse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedGlimpse(null)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedGlimpse(null)}
              className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-slate-700 shadow"
            >
              Close
            </button>
            <img
              src={selectedGlimpse.image_url}
              alt="Selected memory"
              className="w-full max-h-[80vh] object-contain bg-slate-950"
            />
          </div>
        </div>
      )}
    </div>
  );
}
