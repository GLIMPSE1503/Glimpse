import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let memoryCount = 0;

  if (user) {
    const { count, error } = await supabase
      .from("glimpses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!error && typeof count === "number") {
      memoryCount = count;
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/70 p-8 shadow-xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={user?.user_metadata.avatar_url || "/placeholder-avatar.png"}
                alt="Profile avatar"
                className="h-24 w-24 rounded-full border-4 border-purple-200 object-cover"
              />

              <div>
                <h1 className="text-4xl font-bold text-slate-900">
                  {user?.user_metadata.full_name ?? "Your Profile"}
                </h1>
                <p className="mt-2 text-gray-600">{user?.email ?? "Not signed in"}</p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-400 px-6 py-3 text-white shadow-lg transition hover:brightness-110"
            >
              Back to feed
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-purple-50 p-6 text-center shadow-sm">
              <p className="text-sm uppercase tracking-[0.25em] text-purple-500">
                Memories uploaded
              </p>
              <p className="mt-4 text-5xl font-semibold text-slate-900">{memoryCount}</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                Name
              </p>
              <p className="mt-4 text-xl font-semibold text-slate-900">{user?.user_metadata.full_name ?? "—"}</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                Email
              </p>
              <p className="mt-4 text-xl font-semibold text-slate-900">{user?.email ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
