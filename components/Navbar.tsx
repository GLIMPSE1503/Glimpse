"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  user: User | null;
  onUploadOpen: () => void;
}

export default function Navbar({ user, onUploadOpen }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function signIn() {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      className={`sticky top-0 z-50 backdrop-blur-xl transition-all duration-300 ${
        scrolled ? "bg-white/80 shadow-sm" : "bg-white/60"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <div className="flex items-center gap-3 rounded-3xl bg-violet-50 px-4 py-3 shadow-sm">
          <span className="text-lg font-semibold text-violet-700">
            ✨ Glimpse
          </span>
          <span className="text-sm text-slate-500">
            Moments, refined
          </span>
        </div>

        {/* Center Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-200 bg-white hover:bg-violet-50"
          >
            🔍
          </button>

          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-200 bg-white hover:bg-violet-50"
          >
            🔔
          </button>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          <button
            onClick={onUploadOpen}
            className="hidden rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:scale-105 transition md:inline-flex"
          >
            Upload memory
          </button>

          {user ? (
            <div className="relative">

              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="h-12 w-12 overflow-hidden rounded-full border border-slate-200"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-violet-500 text-white font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">

                  <div className="flex items-center gap-3">

                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500 text-white font-bold">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <p className="font-semibold">
                        {user.user_metadata?.full_name || "User"}
                      </p>

                      <p className="text-sm text-slate-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">

                    <Link
                      href={`/profile/${user.id}`}
                      onClick={() => setDropdownOpen(false)}
                      className="block rounded-xl px-4 py-3 hover:bg-violet-50"
                    >
                      Profile
                    </Link>

                    <button
                      onClick={onUploadOpen}
                      className="block w-full rounded-xl px-4 py-3 text-left hover:bg-violet-50"
                    >
                      Upload Memory
                    </button>

                    <LogoutButton />
                  </div>
                </div>
              )}

            </div>
          ) : (
            <button
              onClick={signIn}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}