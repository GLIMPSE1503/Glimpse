"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/notifications/NotificationBell";
import FollowListItem from "@/components/follow/FollowListItem";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { resolveFollowStatuses } from "@/lib/follow";
import { ProfileRow, FollowStatus } from "@/lib/supabase/types";

interface NavbarProps {
  user: User | null;
  onUploadOpen: () => void;
}

export default function Navbar({ user, onUploadOpen }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileRow[]>([]);
  const [searchStatusMap, setSearchStatusMap] = useState<Record<string, FollowStatus>>({});
  const searchRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id ?? null;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setSearchResults([]);
      setSearchStatusMap({});
      return;
    }

    const timeout = setTimeout(async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("full_name", `%${term}%`)
        .limit(8);

      if (error) {
        console.error(error);
        return;
      }

      const results = (data as ProfileRow[]) ?? [];
      setSearchResults(results);

      const statuses = await resolveFollowStatuses(
        supabase,
        currentUserId,
        results.map((p) => p.id)
      );
      setSearchStatusMap(statuses);
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchTerm, currentUserId]);

  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  function closeSearch() {
    setSearchOpen(false);
    setMobileMenuOpen(false);
    setSearchTerm("");
  }

  function handleSearchFollowChange(userId: string, status: FollowStatus) {
    setSearchStatusMap((current) => ({ ...current, [userId]: status }));
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-3xl bg-violet-50 px-4 py-3 shadow-sm">
            <span className="text-lg font-semibold text-violet-700">✨ Glimpse</span>
            <span className="hidden text-sm text-slate-500 sm:inline">Moments, refined</span>
          </div>

         
        </div>

        <div className="hidden flex-1 items-center justify-center gap-3 md:flex">
          <div ref={searchRef} className="relative w-full max-w-xs">
            <input
              type="text"
              value={searchTerm}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search people..."
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
            />

            <AnimatePresence>
              {searchOpen && searchTerm.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full z-40 mt-2 max-h-96 space-y-2 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-xl"
                >
                  {searchResults.length === 0 ? (
                    <p className="p-3 text-center text-sm text-slate-400">No people found.</p>
                  ) : (
                    searchResults.map((person, index) => (
                      <FollowListItem
                        key={person.id}
                        profile={person}
                        currentUserId={currentUserId}
                        index={index}
                        followStatus={searchStatusMap[person.id] ?? "none"}
                        showRemoveButton={false}
                        onFollowChange={handleSearchFollowChange}
                        onProfileClick={closeSearch}
                      />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onUploadOpen}
            className="hidden rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105 md:inline-flex"
          >
            Upload memory
          </button>

          <NotificationBell currentUserId={currentUserId} />

          {user ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="h-12 w-12 overflow-hidden rounded-full border border-slate-200"
              >
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
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
                      <img src={user.user_metadata.avatar_url} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500 text-white font-bold">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{user.user_metadata?.full_name || "User"}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
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

  <Link
    href="/archive"
    onClick={() => setDropdownOpen(false)}
    className="block rounded-xl px-4 py-3 hover:bg-violet-50"
  >
    Archive
  </Link>

  <Link
    href="/collage"
    onClick={() => setDropdownOpen(false)}
    className="block rounded-xl px-4 py-3 hover:bg-violet-50"
  >
    Monthly Collage
  </Link>

  <Link
    href="/settings"
    onClick={() => setDropdownOpen(false)}
    className="block rounded-xl px-4 py-3 hover:bg-violet-50"
  >
    Settings
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
              className="hidden rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 md:inline-flex"
            >
              Sign in with Google
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-200 bg-white md:hidden"
            aria-label="Menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-2 px-4 py-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search people..."
                className="mb-1 w-full rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
              {searchTerm.trim() &&
                (searchResults.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-slate-400">No people found.</p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((person, index) => (
                      <FollowListItem
                        key={person.id}
                        profile={person}
                        currentUserId={currentUserId}
                        index={index}
                        followStatus={searchStatusMap[person.id] ?? "none"}
                        showRemoveButton={false}
                        onFollowChange={handleSearchFollowChange}
                        onProfileClick={closeSearch}
                      />
                    ))}
                  </div>
                ))}

              

              {user ? (
                <>
                 <Link
  href={`/profile/${user.id}`}
  onClick={() => setMobileMenuOpen(false)}
  className="rounded-xl px-4 py-3 hover:bg-violet-50"
>
  Profile
</Link>

<Link
  href="/archive"
  onClick={() => setMobileMenuOpen(false)}
  className="rounded-xl px-4 py-3 hover:bg-violet-50"
>
  Archive
</Link>

<Link
  href="/collage"
  onClick={() => setMobileMenuOpen(false)}
  className="rounded-xl px-4 py-3 hover:bg-violet-50"
>
  Monthly Collage
</Link>

<Link
  href="/settings"
  onClick={() => setMobileMenuOpen(false)}
  className="rounded-xl px-4 py-3 hover:bg-violet-50"
>
  Settings
</Link>

<button
  onClick={() => {
    setMobileMenuOpen(false);
    onUploadOpen();
  }}
  className="rounded-xl px-4 py-3 text-left hover:bg-violet-50"
>
  Upload Memory
</button>

<div className="px-4 py-2">
  <LogoutButton />
</div>
                </>
              ) : (
                <button onClick={signIn} className="mt-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
                  Sign in with Google
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}