"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadGlimpse } from "@/lib/supabase/storage";

export default function UploadGlimpse() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");

  async function upload() {
    if (!file) return;

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
  console.error("INSERT ERROR:", error);
  alert(`Database error: ${error.message}`);
  return;
}
console.log("INSERT DATA:", data);
console.log("INSERT ERROR:", error);

    alert("Glimpse uploaded 🎉");
    window.location.reload();
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setFile(e.target.files?.[0] || null)
        }
      />

      <input
        placeholder="Caption..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      <button onClick={upload}>
        Upload Glimpse
      </button>
    </div>
  );
}