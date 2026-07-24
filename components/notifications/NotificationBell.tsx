"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { NotificationRow } from "@/lib/supabase/types";

function iconFor(type: NotificationRow["type"]) {
  if (type === "like") return "❤️";
  if (type === "comment") return "💬";
  return "👤";
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const delta = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (delta < 60) return "just now";
  const minutes = Math.floor(delta / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell({ currentUserId }: { currentUserId: string | null }) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, sender_id, glimpse_id, type, message, is_read, created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const senderIds = Array.from(new Set((data ?? []).map((n) => n.sender_id)));
    let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

    if (senderIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", senderIds);

      profileMap = (profilesData ?? []).reduce((acc, p) => {
        acc[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        return acc;
      }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>);
    }

    const enriched = (data ?? []).map((n) => ({
      ...n,
      sender_name: profileMap[n.sender_id]?.full_name ?? "Someone",
      sender_avatar: profileMap[n.sender_id]?.avatar_url ?? null,
    }));

    setNotifications(enriched);
    setLoading(false);
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
    const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    if (error) console.error(error);
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
        aria-label="Notifications"
      >
        🔔
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
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
            {loading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={`/profile/${n.sender_id}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl p-3 transition hover:bg-violet-50 ${
                    !n.is_read ? "bg-violet-50/60" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={n.sender_avatar || "/placeholder-avatar.png"}
                      alt={n.sender_name ?? "User"}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <span className="absolute -bottom-1 -right-1 text-xs">{iconFor(n.type)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-slate-700">{n.message}</p>
                    <p className="text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                  </div>
                </Link>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}