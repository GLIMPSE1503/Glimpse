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

export default function PrivacySection({ userId, profile, onProfileChange }: Props) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  async function togglePrivateAccount() {
    if (saving) return;
    setSaving(true);

    const nextValue = !profile.is_private_account;
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ is_private_account: nextValue })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      console.error(error);
      toast.showToast("Could not update privacy setting.", "error");
      return;
    }

    onProfileChange({ ...profile, is_private_account: nextValue });
    toast.showToast(nextValue ? "Your account is now private." : "Your account is now public.", "success");
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Privacy</h2>
      <p className="mt-1 text-sm text-slate-500">Control who can see your memories and profile.</p>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-100 p-4">
        <div>
          <p className="text-sm font-medium text-slate-800">Private Account</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Only approved followers can see your memories and stories.
          </p>
        </div>
        <button
          type="button"
          onClick={togglePrivateAccount}
          disabled={saving}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            profile.is_private_account ? "bg-purple-500" : "bg-slate-200"
          } disabled:opacity-60`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              profile.is_private_account ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Note: enforcing this setting on profile/feed queries requires matching RLS policy changes on
        `glimpses`/`profiles` — this toggle currently stores the preference; wire the read policies to it
        when you're ready to fully enforce private accounts.
      </p>
    </div>
  );
}