import { createClient } from "./client";

export async function uploadGlimpse(file: File, userId: string) {
  const supabase = createClient();

  const fileName = `${userId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("glimpse-images")
    .upload(fileName, file);

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from("glimpse-images")
    .getPublicUrl(fileName);

  return publicUrl;
}
