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
    return <p>Loading glimpses...</p>;
  }

  return (
    <div className="w-full max-w-md space-y-5">
      <h2 className="text-xl font-bold">
        Your Glimpses 📸
      </h2>

      {glimpses.length === 0 ? (
        <p>No glimpses yet.</p>
      ) : (
        glimpses.map((glimpse) => (
          <div
            key={glimpse.id}
            className="rounded-2xl border p-4 shadow-sm"
          >
            <img
              src={glimpse.image_url}
              alt="glimpse"
              className="w-full rounded-xl"
            />

            {glimpse.caption && (
              <p className="mt-3">
                {glimpse.caption}
              </p>
            )}

            <p className="mt-2 text-sm text-gray-500">
              {new Date(
                glimpse.created_at
              ).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
} 