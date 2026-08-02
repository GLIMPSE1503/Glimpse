import { Suspense } from "react";
import FollowersContent from "./FollowersContent";

export default function FollowersPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-10 text-sm text-slate-500">Loading followers...</div>}>
      <FollowersContent />
    </Suspense>
  );
}
