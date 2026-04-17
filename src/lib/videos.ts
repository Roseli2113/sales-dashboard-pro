import { supabase } from "@/integrations/supabase/client";

/**
 * Deletes a video row and its associated file from the `videos` storage bucket.
 * The file path stored in `file_url` is a Supabase public URL — we extract the
 * object path (everything after `/videos/`) to remove it from storage.
 */
export async function deleteVideo(videoId: string, fileUrl: string | null) {
  if (fileUrl) {
    const marker = "/object/public/videos/";
    const idx = fileUrl.indexOf(marker);
    if (idx !== -1) {
      const path = decodeURIComponent(fileUrl.slice(idx + marker.length));
      await supabase.storage.from("videos").remove([path]);
    }
  }
  const { error } = await supabase.from("videos").delete().eq("id", videoId);
  if (error) throw error;
}
