import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ChatMessage } from "./dashboard-data.server";

/**
 * Live chat is written and read with the service-role client only. Visitor
 * conversations and contact details are no longer readable through the public
 * API, so every widget action goes through these helpers.
 */

export async function createVisitorChat(input: {
  name: string;
  email: string;
  phone: string;
  greeting: string;
}): Promise<{ chatId: string }> {
  const { data, error } = await supabaseAdmin
    .from("live_chats")
    .insert({
      visitor_name: input.name,
      visitor_email: input.email,
      visitor_phone: input.phone,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not start chat");

  await supabaseAdmin.from("live_chat_messages").insert({
    chat_id: data.id,
    sender_type: "admin",
    message: input.greeting,
  });

  return { chatId: data.id };
}

export async function postVisitorMessage(input: {
  chatId: string;
  message: string;
}): Promise<{ message: ChatMessage }> {
  const { data: chat } = await supabaseAdmin
    .from("live_chats")
    .select("id")
    .eq("id", input.chatId)
    .maybeSingle();
  if (!chat) throw new Error("Chat not found");

  const { data, error } = await supabaseAdmin
    .from("live_chat_messages")
    .insert({ chat_id: input.chatId, sender_type: "visitor", message: input.message })
    .select("id, sender_type, message, created_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not send message");

  await supabaseAdmin
    .from("live_chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.chatId);

  return { message: data as ChatMessage };
}

export async function readChatMessages(chatId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabaseAdmin
    .from("live_chat_messages")
    .select("id, sender_type, message, created_at")
    .eq("chat_id", chatId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as ChatMessage[];
}
