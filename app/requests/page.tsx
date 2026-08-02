"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import FollowListItem from "@/components/follow/FollowListItem";
import { getPendingRequests, acceptFollowRequest, rejectFollowRequest, type PendingFollowRequest } from "@/lib/follow";

export default function FollowRequestsPage() {
  const router = useRouter();
  const toast = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [requests, setRequests] = useState<PendingFollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
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

      const pending = await getPendingRequests(supabase, userId);
      setRequests(pending);
      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAccept(requesterId: string) {
    if (!currentUserId || actioningId) return;
    setActioningId(requesterId);

    const previousRequests = requests;
    setRequests((current) => current.filter((r) => r.requesterId !== requesterId));

    const supabase = createClient();
    const result = await acceptFollowRequest(supabase, currentUserId, requesterId);

    setActioningId(null);

    if (!result.success) {
      setRequests(previousRequests);
      toast.showToast(result.errorMessage ?? "Could not accept this request.", "error");
      return;
    }

    toast.showToast("Follow request accepted.", "success");
  }

  async function handleReject(requesterId: string) {
    if (!currentUserId || actioningId) return;
    setActioningId(requesterId);

    const previousRequests = requests;
    setRequests((current) => current.filter((r) => r.requesterId !== requesterId));

    const supabase = createClient();
    const result = await rejectFollowRequest(supabase, currentUserId, requesterId);

    setActioningId(null);

    if (!result.success) {
      setRequests(previousRequests);
      toast.showToast(result.errorMessage ?? "Could not reject this request.", "error");
      return;
    }

    toast.showToast("Follow request rejected.", "success");
  }

  if (checkingAuth) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Follow Requests</h1>
      <p className="mb-6 text-sm text-slate-500">
        {requests.length} pending {requests.length === 1 ? "request" : "requests"}
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white/70 px-8 py-16 text-center shadow-sm">
          <span className="text-4xl">🔔</span>
          <p className="mt-4 text-base font-medium text-slate-600">No pending follow requests.</p>
        </div>
      ) : (
        <motion.div layout className="space-y-2">
          {requests.map((request, index) => (
            <FollowListItem
              key={request.requesterId}
              profile={request.profile}
              currentUserId={currentUserId}
              index={index}
              variant="requests"
              actionLoading={actioningId === request.requesterId}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}