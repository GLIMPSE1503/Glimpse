import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import HomeShell from "@/components/HomeShell";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <HomeShell user={user as User | null} />;
}
