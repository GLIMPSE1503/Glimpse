"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";

type Glimpse = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
};

type ReactionType = "heart" | "purple" | "sparkle";

type ReactionCounts = {
  heart: number;
  purple: number;
  sparkle: number;
};

const defaultReactions: ReactionCounts = {
  heart: 0,
  purple: 0,
  sparkle: 0,
};

export default function GlimpseFeed() {
  const toast = useToast();
  const [glimpses, setGlimpses] = useState<Glimpse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGlimpse, setSelectedGlimpse] = useState<Glimpse | null>(null);
  const [reactions, setReactions] = useState<Record<string, ReactionCounts>>({});

  useEffect(() => {
    async function fetchGlimpses() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("glimpses")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(error);
        toast.showToast("Unable to load memories.", "error");
      } else {
        const memoryList = data || [];
        setGlimpses(memoryList);
        setReactions(
          memoryList.reduce((acc, glimpse) => {
            acc[glimpse.id] = { ...defaultReactions };
            return acc;
          }, {} as Record<string, ReactionCounts>)
        );
      }

      setLoading(false);
    }

    fetchGlimpses();
  }, [toast]);

  function addReaction(id: string, type: ReactionType) {
    setReactions((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [type]: (current[id]?.[type] ?? 0) + 1,
      },
    }));
  }

  function openModal(glimpse: Glimpse) {
    setSelectedGlimpse(glimpse);
  }

  function closeModal() {
    setSelectedGlimpse(null);
  }

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold mb-6 text-purple-700 flex items-center gap-2">
          Your Memories 💜
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-3xl bg-white/90 p-6 shadow-xl"
            >
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
          <p className="text-gray-500">
            No memories yet. Upload your first Glimpse ✨
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {glimpses.map((glimpse) => (
            <div
              key={glimpse.id}
              className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl border border-pink-100 transition-all hover:shadow-2xl"
            >
              <button
                type="button"
                onClick={() => openModal(glimpse)}
                className="group block w-full overflow-hidden"
              >
                <img
                  src={glimpse.image_url}
                  alt="glimpse"
                  className="w-full h-[350px] object-cover transition duration-300 group-hover:scale-105"
                />
              </button>

              <div className="p-5">
                {glimpse.caption && (
                  <p className="text-lg text-gray-700 mb-3">
                    {glimpse.caption}
                  </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500">
                  <span>{new Date(glimpse.created_at).toLocaleString()}</span>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">
                    Tap image to view
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => addReaction(glimpse.id, "heart")}
                    className="rounded-2xl border border-pink-100 bg-pink-50 px-4 py-2 text-pink-600 transition hover:bg-pink-100"
                  >
                    ❤️ {reactions[glimpse.id]?.heart ?? 0}
                  </button>
                  <button
                    type="button"
                    onClick={() => addReaction(glimpse.id, "purple")}
                    className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-2 text-violet-700 transition hover:bg-violet-100"
                  >
                    💜 {reactions[glimpse.id]?.purple ?? 0}
                  </button>
                  <button
                    type="button"
                    onClick={() => addReaction(glimpse.id, "sparkle")}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700 transition hover:bg-slate-100"
                  >
                    ✨ {reactions[glimpse.id]?.sparkle ?? 0}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedGlimpse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-slate-700 shadow"
            >
              Close
            </button>
            <img
              src={selectedGlimpse.image_url}
              alt="Selected memory"
              className="w-full max-h-[80vh] object-contain bg-slate-950"
            />
            <div className="space-y-4 p-6">
              {selectedGlimpse.caption && (
                <p className="text-xl font-semibold text-slate-800">
                  {selectedGlimpse.caption}
                </p>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-gray-500">
                  {new Date(selectedGlimpse.created_at).toLocaleString()}
                </span>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => addReaction(selectedGlimpse.id, "heart")}
                    className="rounded-2xl border border-pink-100 bg-pink-50 px-4 py-2 text-pink-600 transition hover:bg-pink-100"
                  >
                    ❤️ {reactions[selectedGlimpse.id]?.heart ?? 0}
                  </button>
                  <button
                    type="button"
                    onClick={() => addReaction(selectedGlimpse.id, "purple")}
                    className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-2 text-violet-700 transition hover:bg-violet-100"
                  >
                    💜 {reactions[selectedGlimpse.id]?.purple ?? 0}
                  </button>
                  <button
                    type="button"
                    onClick={() => addReaction(selectedGlimpse.id, "sparkle")}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700 transition hover:bg-slate-100"
                  >
                    ✨ {reactions[selectedGlimpse.id]?.sparkle ?? 0}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
