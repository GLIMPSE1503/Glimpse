"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { BlockedUserRow } from "@/lib/supabase/types";

export default function DangerZoneSection({ userId }: { userId: string }) {
  const toast = useToast();
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadBlocked() {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("blocked_users")
        .select("id, blocker_id, blocked_id, created_at")
        .eq("blocker_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const rows = data ?? [];
      const blockedIds = rows.map((r) => r.blocked_id);

      let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      if (blockedIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", blockedIds);

        profileMap = (profilesData ?? []).reduce((acc, p) => {
          acc[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
          return acc;
        }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>);
      }

      setBlockedUsers(
        rows.map((r) => ({
          ...r,
          blocked_name: profileMap[r.blocked_id]?.full_name ?? "Glimpse User",
          blocked_avatar: profileMap[r.blocked_id]?.avatar_url ?? null,
        }))
      );
      setLoading(false);
    }

    loadBlocked();
  }, [userId]);

  async function unblock(blockId: string) {
    const previous = blockedUsers;
    setBlockedUsers((current) => current.filter((b) => b.id !== blockId));

    const supabase = createClient();
    const { error } = await supabase.from("blocked_users").delete().eq("id", blockId);

    if (error) {
      console.error(error);
      setBlockedUsers(previous);
      toast.showToast("Could not unblock this user.", "error");
    }
  }

  async function handleDeleteAccount() {
    if (confirmText !== "DELETE") return;
    setDeleting(true);

    const supabase = createClient();
    const { error } = await supabase.rpc("delete_own_account");

    if (error) {
      console.error(error);
      toast.showToast("Could not delete your account.", "error");
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Blocked Users</h2>
        <p className="mt-1 text-sm text-slate-500">People you've blocked won't be able to see your profile or memories.</p>

        <div className="mt-4 space-y-2">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
            ))
          ) : blockedUsers.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">You haven't blocked anyone.</p>
          ) : (
            blockedUsers.map((blocked) => (
              <div key={blocked.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={blocked.blocked_avatar || "/placeholder-avatar.png"}
                    alt={blocked.blocked_name ?? "User"}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <p className="text-sm font-medium text-slate-800">{blocked.blocked_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => unblock(blocked.id)}
                  className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  Unblock
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <h2 className="text-lg font-semibold text-rose-700">Delete Account</h2>
        <p className="mt-1 text-sm text-rose-600">
          This permanently deletes your account and all memories, comments, likes, and collections. This
          cannot be undone.
        </p>

        <label className="mt-4 block text-xs font-medium text-rose-700">
          Type <span className="font-mono font-semibold">DELETE</span> to confirm
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="mt-1 w-full max-w-xs rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          placeholder="DELETE"
        />

        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={confirmText !== "DELETE" || deleting}
          className="mt-4 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Permanently Delete My Account"}
        </button>
      </div>

      <Link href="/vault" className="block text-sm font-medium text-purple-500 hover:text-purple-600">
        ← Back to Vault
      </Link>
    </div>
  );
}