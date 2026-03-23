import { supabase, isSupabaseConfigured } from "../db/supabase.js";
import { AppError } from "../utils/app-error.js";

export async function uploadScreenshot(
  chatId: string,
  base64Data: string,
  monitorLabel?: string
) {
  if (!isSupabaseConfigured()) {
    throw AppError.internal("Supabase not configured for screenshot storage");
  }

  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Content, "base64");
  const filename = `${chatId}/${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from("screenshots")
    .upload(filename, buffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (uploadError)
    throw AppError.internal(`Upload failed: ${uploadError.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from("screenshots").getPublicUrl(filename);

  const { data, error } = await supabase
    .from("screenshots")
    .insert({
      chat_id: chatId,
      storage_path: filename,
      public_or_signed_url: publicUrl,
      monitor_label: monitorLabel || null,
    })
    .select()
    .single();

  if (error)
    throw AppError.internal(`Failed to save screenshot record: ${error.message}`);

  return data;
}

export async function getScreenshotUrl(screenshotId: string) {
  const { data, error } = await supabase
    .from("screenshots")
    .select("*")
    .eq("id", screenshotId)
    .single();

  if (error) throw AppError.notFound("Screenshot not found");
  return data.public_or_signed_url || data.storage_path;
}

export async function getLatestScreenshot(chatId: string) {
  const { data } = await supabase
    .from("screenshots")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data;
}
