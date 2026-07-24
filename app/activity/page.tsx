"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NotificationRow } from "@/lib/supabase/types";

function iconFor(type: NotificationRow["type"]) {
  if (type === "like") return "❤️";
  if (type === "comment") return "💬";
  return "👤";
}

function isToday(date: Date, now: Date) {
  return date.toDateString() === now.toDateString();
}

function isYesterday(date: Date, now: Date) {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
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

export default function ActivityPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;
      setCurrentUserId(userId);

      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("id, user_id, sender_id, glimpse_id, type, message, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const rows = data ?? [];
      const senderIds = Array.from(new Set(rows.map((n) => n.sender_id)));

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

      const enriched = rows.map((n) => ({
        ...n,
        sender_name: profileMap[n.sender_id]?.full_name ?? "Someone",
        sender_avatar: profileMap[n.sender_id]?.avatar_url ?? null,
      }));

      setNotifications(enriched);
      setLoading(false);
    }

    load();
  }, []);

  const now = new Date();
  const todayItems = notifications.filter((n) => isToday(new Date(n.created_at), now));
  const yesterdayItems = notifications.filter((n) => isYesterday(new Date(n.created_at), now));
  const earlierItems = notifications.filter(
    (n) => !isToday(new Date(n.created_at), now) && !isYesterday(new Date(n.created_at), now)
  );

  function Section({ title, items }: { title: string; items: NotificationRow[] }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">{title}</h2>
        <div className="space-y-2">
          {items.map((n) => (
            <Link
              key={n.id}
              href={`/profile/${n.sender_id}`}
              className={`flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition hover:bg-violet-50 ${
                !n.is_read ? "bg-violet-50/50" : "bg-white"
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={n.sender_avatar || "/placeholder-avatar.png"}
                  alt={n.sender_name ?? "User"}
                  className="h-11 w-11 rounded-full object-cover"
                />
                <span className="absolute -bottom-1 -right-1 text-sm">{iconFor(n.type)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">{n.message}</p>
                <p className="text-xs text-slate-400">{timeAgo(n.created_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Activity</h1>

      {!currentUserId && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-16 text-center shadow-sm">
          <span className="text-4xl">🔔</span>
          <p className="mt-4 text-lg font-medium text-slate-600">Sign in to see your activity.</p>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 px-8 py-16 text-center shadow-sm">
          <span className="text-4xl">✨</span>
          <p className="mt-4 text-lg font-medium text-slate-600">No activity yet.</p>
        </div>
      ) : (
        <>
          <Section title="Today" items={todayItems} />
          <Section title="Yesterday" items={yesterdayItems} />
          <Section title="Earlier" items={earlierItems} />
        </>
      )}
    </div>
  );
}