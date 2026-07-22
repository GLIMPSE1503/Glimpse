"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import GlimpseFeed from "@/components/GlimpseFeed";
import UploadModal from "@/components/UploadModal";
import UploadGlimpse from "@/components/UploadGlimpse";

interface HomeShellProps {
  user: User | null;
}

export default function HomeShell({ user }: HomeShellProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const firstName = user?.user_metadata.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.15),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.18),_transparent_28%),linear-gradient(180deg,_#faf5ff_0%,_#f8fafc_100%)] text-slate-900">
      <Navbar user={user} onUploadOpen={() => setUploadOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="flex flex-col gap-10"
        >
          {user ? (
            <div className="rounded-[36px] border border-white/80 bg-white/80 p-6 shadow-2xl shadow-slate-200/20 backdrop-blur-xl">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                 <p className="text-sm uppercase tracking-[0.35em] text-violet-500">
  Welcome back ✨
</p>

<h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
  Every memory tells a story.
</h1>

<p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
  Save the moments you never want to forget and revisit them anytime.
</p>
                </div>
                <div className="flex items-center gap-3 rounded-[28px] bg-gradient-to-r from-pink-50 to-purple-50px-5 py-4 shadow-sm shadow-slate-200/40">
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata.full_name || "User avatar"}
                    className="h-20 w-20 rounded-full border border-white object-cover"
                  />
                  <div>
                    <p className="text-xl font-semibold text-slate-900">{user.user_metadata.full_name}</p>
                    <p className="text-sm leading-5 text-slate-500">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[36px] border border-dashed border-slate-200 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
              <h1 className="text-2xl font-semibold text-slate-900">Welcome to Glimpse.</h1>
              <p className="mt-3 text-base leading-7 text-slate-600">Sign in to start saving your memories in one beautiful place.</p>
            </div>
          )}

          <GlimpseFeed />
        </motion.section>
      </main>

      <AnimatePresence>
        {uploadOpen && (
          <UploadModal onClose={() => setUploadOpen(false)}>
            <UploadGlimpse onClose={() => setUploadOpen(false)} />
          </UploadModal>
        )}
      </AnimatePresence>
 
      <motion.button
        type="button"
        onClick={() => setUploadOpen(true)}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed bottom-8 right-8 z-50 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-3xl text-white shadow-2xl shadow-purple-500/30 transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-200"
        aria-label="Add new memory"
      >
        +
      </motion.button>
    </div>
  );
}
