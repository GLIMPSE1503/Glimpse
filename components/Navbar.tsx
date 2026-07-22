"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";

interface NavbarProps {
  user: User | null;
  onUploadOpen: () => void;
}

export default function Navbar({ user, onUploadOpen }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`sticky top-0 z-50 backdrop-blur-xl transition-all duration-300 ${
        scrolled ? "bg-white/80 shadow-sm" : "bg-white/60"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-3xl bg-violet-50 px-4 py-3 shadow-sm shadow-violet-100/70">
            <span className="text-lg font-semibold text-violet-700">✨ Glimpse</span>
            <span className="text-sm text-slate-500">Moments, refined</span>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            aria-label="Search memories"
            className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-600 transition hover:border-violet-200 hover:bg-violet-50"
          >
            <span className="text-xl">🔍</span>
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-600 transition hover:border-violet-200 hover:bg-violet-50"
          >
            <span className="text-xl">🔔</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onUploadOpen}
            className="hidden rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200/40 transition hover:brightness-105 md:inline-flex"
          >
            Upload memory
          </button>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-violet-200"
              >
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.full_name || "Profile avatar"}
                  className="h-10 w-10 rounded-full object-cover"
                />
              </button>

              <div className="absolute right-0 mt-3 w-72">
                <div
                  className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-xl transition duration-200 ${
                    dropdownOpen ? "opacity-100 visible translate-y-0" : "pointer-events-none opacity-0 invisible -translate-y-2"
                  }`}
                >
                  <div className="flex items-center gap-3 rounded-3xl bg-slate-50 p-3">
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata.full_name || "Avatar"}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{user.user_metadata.full_name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Link
                      href="/profile"
                      className="block rounded-3xl px-4 py-3 text-sm text-slate-700 transition hover:bg-violet-50"
                    >
                      View profile
                    </Link>
                    <button
                      type="button"
                      onClick={onUploadOpen}
                      className="block w-full rounded-3xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-violet-50"
                    >
                      Upload memory
                    </button>
                    <LogoutButton />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/"
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}
