import { supabase } from "../db/supabase.js";
import { AppError } from "../utils/app-error.js";

export async function appendMessage(
  chatId: string,
  role: "user" | "assistant" | "system",
  content: string
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, role, content })
    .select()
    .single();

  if (error) throw AppError.internal(`Failed to append message: ${error.message}`);

  await supabase
    .from("chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatId);

  return data;
}

export async function getRecentMessages(chatId: string, count = 10) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(count);

  if (error)
    throw AppError.internal(`Failed to get messages: ${error.message}`);

  return (data || []).reverse();
}
