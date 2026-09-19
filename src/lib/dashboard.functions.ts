import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  loadBilling,
  loadDomains,
  loadIncome,
  loadServices,
  loadChatMessages,
  type BillingPayload,
  type DomainsPayload,
  type IncomePayload,
  type ServicesPayload,
  type ChatMessage,
} from "./dashboard-data.server";

export const getDashboardBilling = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BillingPayload> => {
    return loadBilling(context.supabase, context.userId);
  });

export const getDashboardServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServicesPayload> => {
    return loadServices(context.supabase, context.userId);
  });

export const getDashboardDomains = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DomainsPayload> => {
    return loadDomains(context.supabase, context.userId);
  });

export const getDashboardIncome = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IncomePayload> => {
    return loadIncome(context.supabase, context.userId);
  });

export const getLiveChatMessages = createServerFn({ method: "GET" })
  .inputValidator((data: { chatId: string; visitorToken: string }) => {
    if (!data?.chatId || !data?.visitorToken) throw new Error("chat session is required");
    return data;
  })
  .handler(async ({ data }): Promise<{ messages: ChatMessage[] }> => {
    const { readChatMessages } = await import("./live-chat.server");
    return { messages: await readChatMessages(data.chatId, data.visitorToken) };
  });

export const startLiveChat = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; email: string; phone: string; greeting: string }) => {
    const name = (data?.name ?? "").trim();
    const email = (data?.email ?? "").trim();
    const phone = (data?.phone ?? "").trim();
    const greeting = (data?.greeting ?? "").trim();
    if (!name || !email || !phone) throw new Error("name, email and phone are required");
    return { name, email, phone, greeting };
  })
  .handler(async ({ data }): Promise<{ chatId: string; visitorToken: string }> => {
    const { createVisitorChat } = await import("./live-chat.server");
    return createVisitorChat(data);
  });

export const sendLiveChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data: { chatId: string; visitorToken: string; message: string }) => {
    const chatId = (data?.chatId ?? "").trim();
    const message = (data?.message ?? "").trim();
    if (!chatId || !data?.visitorToken || !message) throw new Error("chat session and message are required");
    return { chatId, visitorToken: data.visitorToken, message: message.slice(0, 2000) };
  })
  .handler(async ({ data }): Promise<{ message: ChatMessage }> => {
    const { postVisitorMessage } = await import("./live-chat.server");
    return postVisitorMessage(data);
  });

export const startCallRecordFn = createServerFn({ method: "POST" })
  .inputValidator((data: { chatId: string; visitorToken: string; callerRole: string; startedAt: string }) => {
    if (!data?.chatId || !data?.visitorToken || data.callerRole !== "visitor" || !data?.startedAt) throw new Error("invalid call data");
    return data;
  })
  .handler(async ({ data }): Promise<{ id: string | null }> => {
    const { startCallRecord } = await import("./live-chat.server");
    return startCallRecord(data);
  });

export const updateCallRecordFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; chatId: string; visitorToken: string; status: string; durationSeconds?: number; ended?: boolean }) => {
    if (!data?.id || !data?.chatId || !data?.visitorToken || !data?.status) throw new Error("invalid call update");
    return data;
  })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { updateCallRecord } = await import("./live-chat.server");
    return updateCallRecord(data);
  });

async function requireStaff(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .in("role", ["admin", "call_center"])
    .limit(1);
  if (!data?.length) throw new Error("Forbidden");
}

export const startStaffCallRecordFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { chatId: string; startedAt: string }) => {
    if (!data?.chatId || !data?.startedAt) throw new Error("invalid call data");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ id: string | null }> => {
    await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("call_history").insert({
      chat_id: data.chatId, caller_role: "admin", started_at: data.startedAt, status: "ringing",
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row?.id ?? null };
  });

export const updateStaffCallRecordFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; chatId: string; status: string; durationSeconds?: number; ended?: boolean }) => {
    if (!data?.id || !data?.chatId || !data?.status) throw new Error("invalid call update");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { status: string; ended_at?: string; duration_seconds?: number } = { status: data.status };
    if (data.ended) patch.ended_at = new Date().toISOString();
    if (typeof data.durationSeconds === "number") patch.duration_seconds = data.durationSeconds;
    const { error } = await supabaseAdmin.from("call_history").update(patch).eq("id", data.id).eq("chat_id", data.chatId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
