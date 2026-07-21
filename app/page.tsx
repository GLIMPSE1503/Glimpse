import { createClient } from "@/lib/supabase/server";
import LoginButton from "@/components/LoginButton";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex items-center justify-center">
      {user ? (
        <h1>
          Logged in as: {user.email}
        </h1>
      ) : (
        <LoginButton />
      )}
    </main>
  );
}