"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadGlimpse } from "@/lib/supabase/storage";
import { useToast } from "@/components/ToastProvider";

interface UploadGlimpseProps {
  onClose?: () => void;
}

export default function UploadGlimpse({ onClose }: UploadGlimpseProps) {
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
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  is_archived: false,
});

      if (error) {
        console.error("INSERT ERROR:", error);
        toast.showToast(`Database error: ${error.message}`, "error");
        return;
      }

      toast.showToast("Glimpse uploaded 🎉", "success");
      onClose?.();
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
    <div className="rounded-[32px] bg-slate-950/5 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
      <div className="mb-6 flex flex-col gap-3">
        <div className="inline-flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-200/80">
          <span className="text-xl">📷</span>
          <span>New memory</span>
        </div>

        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Capture your next moment.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Upload a beautiful photo, add a short caption, and share it instantly.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <label className="grid gap-3 rounded-[28px] border border-dashed border-slate-200 bg-white/90 p-5 text-sm text-slate-600 transition hover:border-violet-300 hover:bg-violet-50/80">
          <span className="font-medium text-slate-800">Choose an image</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="cursor-pointer"
          />
        </label>

        <textarea
          placeholder="Add a caption for this memory..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="min-h-[140px] w-full rounded-[28px] border border-slate-200 bg-white/90 p-5 text-sm text-slate-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
        />

        <button
          type="button"
          onClick={upload}
          disabled={uploading}
          className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-violet-400/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "Upload memory"}
        </button>
      </div>
    </div>
  );
}