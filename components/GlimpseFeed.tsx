"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Glimpse = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
};

export default function GlimpseFeed() {
  const [glimpses, setGlimpses] = useState<Glimpse[]>([]);
  const [loading, setLoading] = useState(true);

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
      } else {
        setGlimpses(data || []);
      }

      setLoading(false);
    }

    fetchGlimpses();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-lg">
        Loading memories...
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
        <div className="grid md:grid-cols-2 gap-6">
          {glimpses.map((glimpse) => (
            <div
              key={glimpse.id}
              className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl border border-pink-100 hover:shadow-2xl transition-all"
            >
              <img
                src={glimpse.image_url}
                alt="glimpse"
                className="w-full h-[350px] object-cover"
              />

              <div className="p-5">
                {glimpse.caption && (
                  <p className="text-lg text-gray-700 mb-3">
                    {glimpse.caption}
                  </p>
                )}

                <p className="text-sm text-gray-500">
                  {new Date(
                    glimpse.created_at
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}