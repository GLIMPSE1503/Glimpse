"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { NotificationRow } from "@/lib/supabase/types";

function messageFor(n: NotificationRow) {
  if (n.type === "like") return "liked your memory";
  if (n.type === "comment") return "commented on your memory";
  return "started following you";
}

export default function NotificationBell({ currentUserId }: { currentUserId: string | null }) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);

  async function loadNotifications() {
    if (!currentUserId) return;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, actor_id, type, glimpse_id, comment_id, is_read, created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error(error);
      return;
    }

    const actorIds = Array.from(new Set((data ?? []).map((n) => n.actor_id)));
    let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

    if (actorIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", actorIds);

      profileMap = (profilesData ?? []).reduce((acc, p) => {
        acc[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        return acc;
      }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>);
    }

    const enriched = (data ?? []).map((n) => ({
      ...n,
      actor_name: profileMap[n.actor_id]?.full_name ?? "Someone",
      actor_avatar: profileMap[n.actor_id]?.avatar_url ?? null,
    }));

    setNotifications(enriched);
  }

  useEffect(() => {
    loadNotifications();
    if (!currentUserId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${currentUserId}` },
        () => loadNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  async function markAllRead() {
    if (!currentUserId) return;
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((current) => current.map((n) => ({ ...n, is_read: true })));

    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!currentUserId) return null;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((current) => !current);
          if (!open) markAllRead();
        }}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-200 bg-white hover:bg-violet-50"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 z-40 mt-3 max-h-96 w-80 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-3 shadow-xl"
          >
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={`/profile/${n.actor_id}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl p-3 transition hover:bg-violet-50 ${
                    !n.is_read ? "bg-violet-50/60" : ""
                  }`}
                >
                  <img
                    src={n.actor_avatar || "/placeholder-avatar.png"}
                    alt={n.actor_name ?? "User"}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">{n.actor_name}</span> {messageFor(n)}
                  </p>
                </Link>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}