"use client";

import type { Dispatch, SetStateAction } from "react";
import type { ProfileRow } from "@/lib/supabase/types";

type Props = {
  userId: string;
  profile: ProfileRow;
  onProfileChange: Dispatch<SetStateAction<ProfileRow | null>>;
};

export default function ArchiveSection({
  userId,
  profile,
  onProfileChange,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Archive Settings
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Archive settings will be available soon.
      </p>
    </div>
  );
}