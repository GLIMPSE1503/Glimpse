import { Suspense } from "react";
import FollowingContent from "./FollowingContent";

export default function FollowingPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-10 text-sm text-slate-500">Loading following...</div>}>
      <FollowingContent />
    </Suspense>
  );
}
