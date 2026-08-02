"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import ArchiveGrid from "@/components/archive/ArchiveGrid";
import ArchiveViewer from "@/components/archive/ArchiveViewer";
import { GlimpseStatsRow } from "@/lib/supabase/types";

export default function ArchivePage() {
  const router = useRouter();
  const toast = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [archivedGlimpses, setArchivedGlimpses] = useState<GlimpseStatsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadArchive() {
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

      // RLS already guarantees a caller can only ever see their own archived
      // rows (see the "Users can view visible glimpses" policy), but we also
      // filter explicitly here as defense in depth and to avoid depending
      // solely on the database layer for correctness.
      const { data, error } = await supabase
        .from("glimpse_stats")
        .select("*")
        .eq("user_id", userId)
        .eq("is_archived", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        toast.showToast("Could not load your archive.", "error");
        setLoading(false);
        return;
      }

      setArchivedGlimpses((data as GlimpseStatsRow[]) ?? []);
      setLoading(false);
    }

    loadArchive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checkingAuth) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-10 w-48 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square w-full animate-pulse rounded-3xl bg-slate-200" />
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
        <h1 className="text-2xl font-semibold text-slate-900">Your Archive</h1>
        <p className="mt-1 text-sm text-slate-500">
          Memories that expired after 24 hours. Only you can see this.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square w-full animate-pulse rounded-3xl bg-slate-200" />
          ))}
        </div>
      ) : archivedGlimpses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-20 text-center shadow-sm">
          <span className="text-4xl">🗄️</span>
          <p className="mt-4 text-lg font-medium text-slate-600">Nothing archived yet.</p>
          <p className="mt-1 text-sm text-slate-400">
            Memories automatically move here 24 hours after upload.
          </p>
        </div>
      ) : (
        <ArchiveGrid glimpses={archivedGlimpses} onSelect={setSelectedIndex} />
      )}

      <ArchiveViewer
        glimpses={archivedGlimpses}
        selectedIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onNavigate={setSelectedIndex}
      />
    </div>
  );
}