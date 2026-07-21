"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadGlimpse } from "@/lib/supabase/storage";
import { useToast } from "@/components/ToastProvider";

export default function UploadGlimpse() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  async function upload() {
    if (!file) {
      toast.showToast("Select a photo to upload your memory.", "info");
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.showToast("Please sign in to upload a memory.", "error");
        return;
      }

      const imageUrl = await uploadGlimpse(file, user.id);

      const { error } = await supabase
        .from("glimpses")
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          caption,
        });

      if (error) {
        console.error("INSERT ERROR:", error);
        toast.showToast(`Database error: ${error.message}`, "error");
        return;
      }

      toast.showToast("Glimpse uploaded 🎉", "success");
      window.location.reload();
    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      toast.showToast(
        error instanceof Error
          ? `Upload failed: ${error.message}`
          : "Upload failed. Please try again.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-pink-100">
      <h2 className="text-3xl font-bold mb-2 text-purple-700 flex items-center gap-2">
        Share a Glimpse 📸
      </h2>

      <p className="text-gray-700 mb-6">
        Capture a beautiful moment from your day.
      </p>

      <div className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setFile(e.target.files?.[0] || null)
          }
          className="w-full rounded-2xl border-2 border-purple-200 bg-white p-4 text-gray-700 shadow-sm"
        />

        <input
          placeholder="Write a memory..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
         className="w-full rounded-2xl border-2 border-purple-200 bg-white p-4 text-gray-700 outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
        />

        <button
          type="button"
          onClick={upload}
          disabled={uploading}
          className="w-full rounded-2xl bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-400 text-white font-semibold py-4 shadow-lg hover:scale-[1.02] transition-all disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "Upload Glimpse ✨"}
        </button>
      </div>
    </div>
  );
}