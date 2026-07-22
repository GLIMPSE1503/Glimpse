"use client";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  async function logout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.reload();
  }

  return (
    <button
      onClick={logout}
      className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-full transition"
    >
      Logout
    </button>
  );
}