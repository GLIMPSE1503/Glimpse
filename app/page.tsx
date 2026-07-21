"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email || "");
      }
    };

    checkUser();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      {email ? (
        <h1>Logged in as: {email}</h1>
      ) : (
        <h1>Not Logged In</h1>
      )}
    </main>
  );
}