"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import AccountSection from "@/components/settings/AccountSection";
import PrivacySection from "@/components/settings/PrivacySection";
import NotificationsSection from "@/components/settings/NotificationsSection";
import AppearanceSection from "@/components/settings/AppearanceSection";
import ArchiveSection from "@/components/settings/ArchiveSection";
import DangerZoneSection from "@/components/settings/DangerZoneSection";
import { ProfileRow } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

type SettingsTab = "account" | "privacy" | "notifications" | "appearance" | "archive" | "danger";

const TABS: { key: SettingsTab; label: string; icon: string }[] = [
  { key: "account", label: "Account", icon: "👤" },
  { key: "privacy", label: "Privacy", icon: "🔒" },
  { key: "notifications", label: "Notifications", icon: "🔔" },
  { key: "appearance", label: "Appearance", icon: "🎨" },
  { key: "archive", label: "Archive", icon: "🗄️" },
  { key: "danger", label: "Danger Zone", icon: "⚠️" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();

      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user ?? null);

      if (userData?.user?.id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userData.user.id)
          .maybeSingle();
        setProfile(profileData as ProfileRow | null);
      }

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-10 w-48 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-6 h-64 animate-pulse rounded-[28px] bg-slate-100" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <span className="text-4xl">🔒</span>
        <p className="mt-4 text-lg font-medium text-slate-600">Sign in to manage your settings.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Settings</h1>

      <div className="flex flex-col gap-6 md:flex-row">
        <nav className="flex gap-2 overflow-x-auto md:w-56 md:flex-col md:overflow-visible">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-purple-500 text-white shadow-sm shadow-purple-200"
                  : "bg-white text-slate-600 hover:bg-violet-50"
              }`}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex-1 rounded-[28px] border border-white/90 bg-white/90 p-6 shadow-lg shadow-slate-200/40 backdrop-blur-xl"
        >
          {activeTab === "account" && <AccountSection user={user} profile={profile} />}
          {activeTab === "privacy" && profile && (
            <PrivacySection userId={user.id} profile={profile} onProfileChange={setProfile} />
          )}
          {activeTab === "notifications" && profile && (
            <NotificationsSection userId={user.id} profile={profile} onProfileChange={setProfile} />
          )}
          {activeTab === "appearance" && <AppearanceSection />}
          {activeTab === "archive" && profile && (
            <ArchiveSection userId={user.id} profile={profile} onProfileChange={setProfile} />
          )}
          {activeTab === "danger" && <DangerZoneSection userId={user.id} />}
        </motion.div>
      </div>
    </div>
  );
}