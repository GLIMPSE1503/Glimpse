"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { ProfileRow } from "@/lib/supabase/types";

type Props = {
  profileId: string;
  initialFullName: string;
  initialBio: string;
  initialAvatarUrl: string;
  initialCoverUrl: string;
  onClose: () => void;
  onSaved: (profile: ProfileRow) => void;
};

export default function EditProfileModal({
  profileId,
  initialFullName,
  initialBio,
  initialAvatarUrl,
  initialCoverUrl,
  onClose,
  onSaved,
}: Props) {
  const toast = useToast();
  const [fullName, setFullName] = useState(initialFullName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function uploadFile(file: File, folder: string) {
    const supabase = createClient();
    const filePath = `${profileId}/${folder}-${Date.now()}-${file.name}`;

    const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    let finalAvatarUrl = avatarUrl;
    let finalCoverUrl = coverUrl;

    try {
      if (avatarFile) finalAvatarUrl = await uploadFile(avatarFile, "avatar");
      if (coverFile) finalCoverUrl = await uploadFile(coverFile, "cover");
    } catch (uploadError) {
      console.error(uploadError);
      toast.showToast("Could not upload your images.", "error");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: profileId,
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: finalAvatarUrl || null,
        cover_url: finalCoverUrl || null,
        updated_at: new Date().toISOString(),
      })
      .select("id, full_name, bio, avatar_url, cover_url, created_at, updated_at")
      .single();

    setSaving(false);

    if (error) {
      console.error(error);
      toast.showToast("Could not update profile.", "error");
      return;
    }

    toast.showToast("Profile updated ✨", "success");
    onSaved(data as ProfileRow);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl"
        >
          <div
            className="relative h-28 w-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400"
            style={
              coverUrl
                ? { backgroundImage: `url(${coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          >
            <label className="absolute bottom-2 right-2 cursor-pointer rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-white">
              Change Cover
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCoverFile(file);
                    setCoverUrl(URL.createObjectURL(file));
                  }
                }}
              />
            </label>
          </div>

          <div className="p-7">
            <h2 className="text-lg font-semibold text-slate-900">Edit Profile</h2>

            <div className="-mt-16 flex flex-col items-center gap-3">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-slate-400">
                    {fullName.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <label className="cursor-pointer rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200">
                Change Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarFile(file);
                      setAvatarUrl(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                  placeholder="Tell people a little about yourself..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-purple-500 px-5 py-2 text-sm font-medium text-white shadow-sm shadow-purple-200 hover:bg-purple-600 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}