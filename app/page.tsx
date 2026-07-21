import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LoginButton from "@/components/LoginButton";
import UploadGlimpse from "@/components/UploadGlimpse";
import GlimpseFeed from "@/components/GlimpseFeed";
import LogoutButton from "@/components/LogoutButton";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
      {user ? (
        <div className="w-full max-w-5xl mx-auto">

          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-lg p-6 mb-8 border border-white/50">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-400 bg-clip-text text-transparent">
                  Glimpse ✨
                </h1>

                <p className="text-gray-600 mt-2">
                  Save the little moments that matter.
                </p>
              </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="profile"
                      className="w-12 h-12 rounded-full border-2 border-white shadow"
                    />

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-gray-800">
                        {user.user_metadata.full_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {user.email}
                      </span>
                    </div>

                    <Link href="/profile" className="rounded-full bg-violet-100 px-4 py-2 text-violet-700 transition hover:bg-violet-200">
                      View profile
                    </Link>

                    <LogoutButton />
                  </div>
                </div>
              </div>

          <UploadGlimpse />

          <div className="mt-10">
            <GlimpseFeed />
          </div>

        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md">
            <h1 className="text-4xl font-bold mb-3">
              Glimpse ✨
            </h1>

            <p className="text-gray-500 mb-6">
              Share your daily moments with people who matter.
            </p>

            <LoginButton />
          </div>
        </div>
      )}
    </main>
  );
}