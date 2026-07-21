"use client";

import { signInWithGoogle } from "@/lib/supabase/auth";

export default function LoginButton() {
  return (
    <button
      onClick={signInWithGoogle}
      className="rounded-full bg-black text-white px-8 py-3"
    >
      Sign in with Google
    </button>
  );
}