import { createClient } from "@/lib/supabase/server";
import LoginButton from "@/components/LoginButton";
import UploadGlimpse from "@/components/UploadGlimpse";
import GlimpseFeed from "@/components/GlimpseFeed";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      {user ? (
        <>
          <h1 className="text-2xl font-bold">
            Welcome {user.email}
          </h1>

          <UploadGlimpse />

          <GlimpseFeed />
        </>
      ) : (
        <LoginButton />
      )}
    </main>
  );
}