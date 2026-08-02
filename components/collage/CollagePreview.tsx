"use client";

import { GlimpseRow } from "@/lib/supabase/types";

type Props = {
  glimpses: GlimpseRow[];
};

function EmptySlot() {
  return (
    <div className="flex aspect-square items-center justify-center rounded-2xl bg-slate-100 text-3xl text-slate-300">
      ✨
    </div>
  );
}

export default function CollagePreview({ glimpses }: Props) {
  const selected = glimpses.slice(0, 9);

  if (selected.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-slate-500">
        No memories found.
      </div>
    );
  }

  // 1 photo
  if (selected.length === 1) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="aspect-square overflow-hidden rounded-3xl">
          <img
            src={selected[0].image_url}
            alt={selected[0].caption ?? "Memory"}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    );
  }

  // 2–4 photos
  if (selected.length <= 4) {
    return (
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-2 rounded-3xl bg-white p-2">
        {Array.from({ length: 4 }).map((_, i) => {
          const glimpse = selected[i];

          return glimpse ? (
            <div
              key={glimpse.id}
              className="aspect-square overflow-hidden rounded-2xl"
            >
              <img
                src={glimpse.image_url}
                alt={glimpse.caption ?? "Memory"}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <EmptySlot key={i} />
          );
        })}
      </div>
    );
  }

  // 5–9 photos
  return (
    <div className="mx-auto grid max-w-xl grid-cols-3 gap-2 rounded-3xl bg-white p-2">
      {Array.from({ length: 9 }).map((_, i) => {
        const glimpse = selected[i];

        return glimpse ? (
          <div
            key={glimpse.id}
            className="aspect-square overflow-hidden rounded-xl"
          >
            <img
              src={glimpse.image_url}
              alt={glimpse.caption ?? "Memory"}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <EmptySlot key={i} />
        );
      })}
    </div>
  );
}