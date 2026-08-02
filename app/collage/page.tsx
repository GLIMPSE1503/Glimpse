"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import MonthlyCollageCard from "../../components/collage/MonthlyCollageCard";
import CollageModal from "../../components/collage/CollageModal";
import { GlimpseRow } from "@/lib/supabase/types";

type MonthGroup = {
  key: string;
  label: string;
  glimpses: GlimpseRow[];
};

function monthKeyFor(dateString: string) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFor(dateString: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(dateString));
}

export default function CollagePage() {
  const router = useRouter();
  const toast = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [glimpses, setGlimpses] = useState<GlimpseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeGroup, setActiveGroup] = useState<MonthGroup | null>(null);

  useEffect(() => {
    async function loadMemories() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;

      if (!userId) {
        setCheckingAuth(false);
        router.push("/");
        return;
      }

      setCurrentUserId(userId);
      setCheckingAuth(false);
      setLoading(true);

     const { data, error } = await supabase
  .from("glimpses")
  .select("id, user_id, image_url, caption, created_at, expires_at, is_archived, is_pinned")
  .eq("user_id", userId)
  .order("created_at", { ascending: false });

    if (error) {
  console.error("COLLAGE ERROR:", error);
  toast.showToast(error.message, "error");
  setLoading(false);
  return;
}

      setGlimpses((data as GlimpseRow[]) ?? []);
      setLoading(false);
    }

    loadMemories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthGroups = useMemo<MonthGroup[]>(() => {
    const groups = new Map<string, MonthGroup>();

    glimpses.forEach((glimpse) => {
      const key = monthKeyFor(glimpse.created_at);
      if (!groups.has(key)) {
        groups.set(key, { key, label: monthLabelFor(glimpse.created_at), glimpses: [] });
      }
      groups.get(key)!.glimpses.push(glimpse);
    });

    return Array.from(groups.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [glimpses]);

  if (checkingAuth) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-10 w-56 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 w-full animate-pulse rounded-[28px] bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentUserId) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Monthly Collage</h1>
        <p className="mt-1 text-sm text-slate-500">
          Turn each month of memories into a beautiful collage.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 w-full animate-pulse rounded-[28px] bg-slate-200" />
          ))}
        </div>
      ) : monthGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-20 text-center shadow-sm">
          <span className="text-4xl">🖼️</span>
          <p className="mt-4 text-lg font-medium text-slate-600">No memories yet.</p>
          <p className="mt-1 text-sm text-slate-400">
            Upload your first memory to start building monthly collages.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {monthGroups.map((group, index) => (
            <MonthlyCollageCard
              key={group.key}
              label={group.label}
              glimpses={group.glimpses}
              index={index}
              onCreateCollage={() => setActiveGroup(group)}
            />
          ))}
        </div>
      )}

      {activeGroup && (
        <CollageModal
          monthLabel={activeGroup.label}
          glimpses={activeGroup.glimpses}
          onClose={() => setActiveGroup(null)}
        />
      )}
    </div>
  );
}