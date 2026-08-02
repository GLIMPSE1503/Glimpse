"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { acceptFollowRequest, rejectFollowRequest } from "@/lib/follow";

type Props = {
  requesterId: string;
  targetId: string;
  onResolved: (status: "accepted" | "rejected") => void;
};

export default function FollowRequestActions({ requesterId, targetId, onResolved }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState<"accepted" | "rejected" | null>(null);

  async function respond(status: "accepted" | "rejected") {
    if (loading) return;
    setLoading(status);

    const supabase = createClient();
    const result =
      status === "accepted"
        ? await acceptFollowRequest(supabase, targetId, requesterId)
        : await rejectFollowRequest(supabase, targetId, requesterId);

    setLoading(null);

    if (!result.success) {
      console.error(result.errorMessage);
      toast.showToast(result.errorMessage ?? "Could not update this request.", "error");
      return;
    }

    toast.showToast(status === "accepted" ? "Follow request accepted." : "Follow request rejected.", "success");
    onResolved(status);
  }

  return (
    <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          respond("accepted");
        }}
        disabled={loading !== null}
        className="rounded-full bg-purple-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-600 disabled:opacity-60"
      >
        {loading === "accepted" ? "..." : "Accept"}
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          respond("rejected");
        }}
        disabled={loading !== null}
        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-60"
      >
        {loading === "rejected" ? "..." : "Decline"}
      </button>
    </div>
  );
}