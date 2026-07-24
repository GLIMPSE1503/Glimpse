"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { ProfileRow } from "@/lib/supabase/types";

type Props = {
  userId: string;
  profile: ProfileRow;
  onProfileChange: (profile: ProfileRow) => void;
};

type ToggleKey = "notify_likes" | "notify_comments" | "notify_follows";

export default function NotificationsSection({ userId, profile, onProfileChange }: Props) {
  const toast = useToast();
  const [savingKey, setSavingKey] = useState<ToggleKey | null>(null);

  async function toggle(key: ToggleKey) {
    if (savingKey) return;
    setSavingKey(key);

    const nextValue = !profile[key];
    const supabase = createClient();

    const { error } = await supabase.from("profiles").update({ [key]: nextValue }).eq("id", userId);

    setSavingKey(null);

    if (error) {
      console.error(error);
      toast.showToast("Could not update notification setting.", "error");
      return;
    }

    onProfileChange({ ...profile, [key]: nextValue });
  }

  const rows: { key: ToggleKey; label: string; description: string }[] = [
    { key: "notify_likes", label: "Likes", description: "Get notified when someone likes your memory." },
    { key: "notify_comments", label: "Comments", description: "Get notified when someone comments." },
    { key: "notify_follows", label: "New Followers", description: "Get notified when someone follows you." },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
      <p className="mt-1 text-sm text-slate-500">Choose what you want to be notified about.</p>

      <div className="mt-6 space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
            <div>
              <p className="text-sm font-medium text-slate-800">{row.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{row.description}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(row.key)}
              disabled={savingKey === row.key}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                profile[row.key] ? "bg-purple-500" : "bg-slate-200"
              } disabled:opacity-60`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  profile[row.key] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        These toggles control preference storage only. To fully respect them, add a check for
        `notify_likes`/`notify_comments`/`notify_follows` at the top of your `notify_on_like`,
        `notify_on_comment`, and `notify_on_follow` trigger functions in Supabase — skip the insert
        when the recipient has that type turned off.
      </p>
    </div>
  );
}