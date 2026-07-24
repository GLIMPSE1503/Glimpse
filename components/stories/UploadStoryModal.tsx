"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
};

export default function UploadStoryModal({
  open,
  onClose,
  onUploaded,
}: Props) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadStory() {
    if (!file) {
      toast.showToast("Select an image first.", "info");
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.showToast("Please sign in.", "error");
        return;
      }

      const path = `${user.id}/${Date.now()}-${file.name}`;

      const { error: storageError } = await supabase.storage
        .from("stories")
        .upload(path, file, {
          upsert: false,
        });

      if (storageError) throw storageError;

      const { data } = supabase.storage
        .from("stories")
        .getPublicUrl(path);

      const { error } = await supabase.from("stories").insert({
        user_id: user.id,
        image_url: data.publicUrl,
      });

      if (error) throw error;

      toast.showToast("Story uploaded 🎉", "success");

      onUploaded?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.showToast("Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: .9 }}
            animate={{ scale: 1 }}
            exit={{ scale: .9 }}
            className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-5">
              Upload Story
            </h2>

            <input
              type="file"
              accept="image/*"
              onChange={(e)=>setFile(e.target.files?.[0] ?? null)}
              className="mb-6"
            />

            <div className="flex justify-end gap-3">

              <button
                onClick={onClose}
                className="rounded-full px-5 py-2 bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={uploadStory}
                disabled={uploading}
                className="rounded-full px-6 py-2 bg-purple-600 text-white"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>

            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}