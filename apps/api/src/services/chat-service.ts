import { supabase } from "../db/supabase.js";
import { AppError } from "../utils/app-error.js";

export interface CreateChatParams {
  ownerType: "user" | "guest";
  ownerId: string;
  title?: string;
}

export async function createChat(params: CreateChatParams) {
  const { data, error } = await supabase
    .from("chats")
    .insert({
      owner_type: params.ownerType,
      owner_id: params.ownerId,
      title: params.title || null,
    })
    .select()
    .single();

  if (error) throw AppError.internal(`Failed to create chat: ${error.message}`);
  return data;
}

export async function listChats(ownerType: string, ownerId: string) {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) throw AppError.internal(`Failed to list chats: ${error.message}`);
  return data;
}

export async function getChat(chatId: string) {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .single();

  if (error) throw AppError.notFound("Chat not found");
  return data;
}

export async function assertChatOwnedByIdentity(
  chatId: string,
  ownerType: "user" | "guest",
  ownerId: string
) {
  const { data, error } = await supabase
    .from("chats")
    .select("id")
    .eq("id", chatId)
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .single();

  if (error || !data) {
    throw AppError.notFound("Chat not found");
  }
}

export async function getChatTimeline(chatId: string) {
  const [messagesResult, screenshotsResult] = await Promise.all([
    supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true }),
    supabase
      .from("screenshots")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true }),
  ]);

  if (messagesResult.error)
    throw AppError.internal(`Failed to get messages: ${messagesResult.error.message}`);
  if (screenshotsResult.error)
    throw AppError.internal(`Failed to get screenshots: ${screenshotsResult.error.message}`);

  const timeline = [
    ...messagesResult.data.map((m: any) => ({
      ...m,
      type: m.role === "user" ? "user" : m.role === "assistant" ? "assistant" : "system",
      entryType: "message" as const,
    })),
    ...screenshotsResult.data.map((s: any) => ({
      ...s,
      type: "screenshot",
      entryType: "screenshot" as const,
    })),
  ].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return timeline;
}

export async function updateChatTitle(chatId: string, title: string) {
  await supabase
    .from("chats")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", chatId);
}

export async function deleteChat(chatId: string) {
  const { error } = await supabase.from("chats").delete().eq("id", chatId);
  if (error) throw AppError.internal(`Failed to delete chat: ${error.message}`);
}
