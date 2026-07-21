import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");

  console.log("CODE:", code ? "Received" : "Missing");

  if (code) {
    const supabase = await createClient();

    const { data, error } =
      await supabase.auth.exchangeCodeForSession(code);

    console.log("USER:", data.user?.email);
    console.log("ERROR:", error);
  }

  return NextResponse.redirect(`${origin}/`);
}