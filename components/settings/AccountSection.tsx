"use client";

import type { User } from "@supabase/supabase-js";
import { ProfileRow } from "@/lib/supabase/types";

export default function AccountSection({ user, profile }: { user: User; profile: ProfileRow | null }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Account</h2>
      <p className="mt-1 text-sm text-slate-500">Your basic account information.</p>

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
          <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-sm">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-400">
                {(profile?.full_name || user.email || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{profile?.full_name || "Glimpse User"}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-medium text-slate-400">Account created</p>
          <p className="mt-1 text-sm text-slate-700">
            {new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(user.created_at))}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-medium text-slate-400">Sign-in method</p>
          <p className="mt-1 text-sm capitalize text-slate-700">
            {user.app_metadata?.provider || "Email"}
          </p>
        </div>
      </div>
    </div>
  );
}