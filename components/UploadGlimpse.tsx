"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadGlimpse } from "@/lib/supabase/storage";

export default function UploadGlimpse() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload() {
    if (!file) return;
    setUploading(true); 

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const imageUrl = await uploadGlimpse(file, user.id);

    const { data, error } = await supabase
      .from("glimpses")
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        caption,
      });

  if (error) {
  setUploading(false);

  console.error("INSERT ERROR:", error);
  alert(`Database error: ${error.message}`);
  return;
}

    console.log("INSERT DATA:", data);

    setUploading(false);

alert("Glimpse uploaded 🎉");
window.location.reload();
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
          
  onClick={upload}
  disabled={uploading}
          className="w-full rounded-2xl bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-400 text-white font-semibold py-4 shadow-lg hover:scale-[1.02] transition-all"
        >
          {uploading ? "Uploading..." : "Upload Glimpse ✨"}
        </button>
      </div>
    </div>
  );
}