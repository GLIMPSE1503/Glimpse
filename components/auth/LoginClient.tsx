"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginClient() {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    try {
      setLoading(true);

      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error(error);
        alert(error.message);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl">
  <h1 className="mb-2 text-center text-5xl font-extrabold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-purple-600 bg-clip-text text-transparent">
    ✨ Glimpse
  </h1>
        <p className="mb-8 text-center text-slate-500">
          Capture moments. Share memories.
        </p>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full rounded-2xl bg-black px-4 py-3 text-white"
        >
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}